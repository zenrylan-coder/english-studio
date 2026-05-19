const ENV_ID = process.env.NEXT_PUBLIC_TCB_ENV_ID || "english-studio-d3gtn1hkt0affbd95";
const REGION = process.env.NEXT_PUBLIC_TCB_REGION || "ap-shanghai";

let appSingleton: any = null;
let sdkPromise: Promise<any> | null = null;

async function loadCloudbaseSdk() {
  if (typeof window === "undefined") {
    throw new Error("CloudBase SDK is only available in the browser");
  }
  if (!sdkPromise) {
    const dynamicImporter = new Function("m", "return import(m);") as (m: string) => Promise<any>;
    sdkPromise = dynamicImporter("@cloudbase/js-sdk").then((mod) => mod.default || mod);
  }
  return sdkPromise;
}

export async function getCloudbaseApp() {
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

export const CLOUDBASE_ENV_ID = ENV_ID;
