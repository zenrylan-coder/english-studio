const ENV_ID = process.env.NEXT_PUBLIC_TCB_ENV_ID || "english-studio-d3gtn1hkt0affbd95";
const REGION = process.env.NEXT_PUBLIC_TCB_REGION || "ap-shanghai";

type CloudbaseModule = {
  init: (options: { env: string; region: string }) => CloudbaseApp;
};

type CloudbaseApp = {
  auth: (options: { persistence: string }) => CloudbaseAuth;
  database: () => unknown;
  callFunction: (options: { name: string; data?: unknown }) => Promise<{ result?: unknown }>;
};

type CloudbaseAuth = {
  hasLoginState: () => { uid?: string; isAnonymous?: boolean; loginType?: string } | null;
  anonymousAuthProvider: () => { signIn: () => Promise<unknown> };
  signOut?: () => Promise<unknown>;
  /** v3 OTP: sends code + returns verifier */
  signInWithOtp?: (params: { phone?: string; email?: string }) => Promise<OtpResult>;
};

type OtpResult = {
  data?: { verifyOtp: (params: { token: string }) => Promise<OtpVerifyResult> };
  error?: { message: string };
};

type OtpVerifyResult = {
  data?: { user?: { uid: string } };
  error?: { message: string };
};

let appSingleton: CloudbaseApp | null = null;
let sdkPromise: Promise<CloudbaseModule> | null = null;

async function loadCloudbaseSdk(): Promise<CloudbaseModule> {
  if (typeof window === "undefined") {
    throw new Error("CloudBase SDK is only available in the browser");
  }
  if (!sdkPromise) {
    sdkPromise = import("@cloudbase/js-sdk").then((mod) => (mod.default || mod) as unknown as CloudbaseModule);
  }
  return sdkPromise;
}

export async function getCloudbaseApp(): Promise<CloudbaseApp> {
  if (!appSingleton) {
    const cloudbase = await loadCloudbaseSdk();
    appSingleton = cloudbase.init({
      env: ENV_ID,
      region: REGION,
    });
  }
  return appSingleton;
}

export async function getCloudbaseAuth() {
  const app = await getCloudbaseApp();
  return app.auth({
    persistence: "local",
  });
}

export async function getCloudbaseDb() {
  const app = await getCloudbaseApp();
  return app.database();
}

export async function callCloudbaseFunction<T>(name: string, data?: unknown): Promise<T> {
  const app = await getCloudbaseApp();
  const res = await app.callFunction({ name, data });
  return (res?.result ?? null) as T;
}

export function resolveCloudbaseHttpFunctionUrl(pathname: string): string {
  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const override = process.env.NEXT_PUBLIC_TCB_API_BASE;
  if (override) {
    return override.replace(/\/+$/, "") + cleanPath;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.endsWith(".tcloudbaseapp.com")) {
      const apiHost = host.replace(/\.tcloudbaseapp\.com$/, ".ap-shanghai.app.tcloudbase.com");
      return `${window.location.protocol}//${apiHost}${cleanPath}`;
    }
  }
  return cleanPath;
}

export async function callCloudbaseHttpFunction<T>(pathname: string, data?: unknown): Promise<T> {
  const res = await fetch(resolveCloudbaseHttpFunctionUrl(pathname), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data ?? {}),
  });
  let result: T | { ok?: boolean; message?: string; error?: string } | null = null;
  try {
    result = (await res.json()) as T;
  } catch {
    throw new Error(`Invalid JSON from ${pathname}`);
  }
  if (!res.ok) {
    const message =
      result && typeof result === "object" && !Array.isArray(result)
        ? (result as { message?: string; error?: string }).message || (result as { message?: string; error?: string }).error
        : "";
    throw new Error(message || `HTTP ${res.status}`);
  }
  return result as T;
}

export function getPhoneAuthMode(): "mock" | "real" {
  if (typeof window !== "undefined") {
    const mode = process.env.NEXT_PUBLIC_PHONE_AUTH_MODE;
    if (mode === "real") return "real";
  }
  return "mock";
}

export const CLOUDBASE_ENV_ID = ENV_ID;
