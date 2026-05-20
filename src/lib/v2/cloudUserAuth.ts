import { callCloudbaseHttpFunction, getCloudbaseAuth, getPhoneAuthMode } from "./cloudbaseClient";

/** Holds the OTP verifier between sendPhoneCode and verifyPhoneCode */
let otpVerifier: { verifyOtp: (params: { token: string }) => Promise<unknown> } | null = null;
import { safeGetJson, safeSetJson } from "./storage";

const PHONE_AUTH_KEY = "english-studio.v2.phone-auth";

export type SavedPhoneAuthState = {
  v: 1;
  phone: string;
  phoneMasked: string;
  nickname: string;
  avatar: string;
  authMode: "mock" | "sms";
  mockMode: boolean;
  lastLoginAt: number;
};

export type MockCloudSession = {
  uid: string;
  phone: string;
  phoneMasked: string;
  nickname: string;
  avatar: string;
  loginType: "MOCK_PHONE";
  authMode: "mock";
  mockMode: true;
  lastLoginAt: number;
};

type SendCodeResult = {
  ok: boolean;
  mockMode: boolean;
  message: string;
  expiresInSec: number;
};

type VerifyCodeResult = {
  ok: boolean;
  mockMode: boolean;
  message: string;
  profile: {
    phone: string;
    phoneMasked: string;
    nickname: string;
    avatar: string;
  };
};

function buildMockSendCodeResult(): SendCodeResult {
  return {
    ok: true,
    mockMode: true,
    message: "当前为 mock 验证模式，测试验证码固定为 123456",
    expiresInSec: 300,
  };
}

function buildMockVerifyCodeResult(phone: string, nickname?: string): VerifyCodeResult {
  return {
    ok: true,
    mockMode: true,
    message: "手机号验证成功（mock）",
    profile: {
      phone,
      phoneMasked: maskPhone(phone),
      nickname: nickname?.trim() || `词源用户${phone.slice(-4)}`,
      avatar: "词",
    },
  };
}

export function normalizePhone(raw: string): string {
  return String(raw || "").replace(/\D+/g, "").slice(0, 11);
}

export function isValidChinaPhone(phone: string): boolean {
  return /^1\d{10}$/.test(normalizePhone(phone));
}

export function maskPhone(phone: string): string {
  const v = normalizePhone(phone);
  if (v.length < 7) return v;
  return `${v.slice(0, 3)}****${v.slice(-4)}`;
}

export function loadSavedPhoneAuth(): SavedPhoneAuthState | null {
  const data = safeGetJson<SavedPhoneAuthState>(PHONE_AUTH_KEY);
  if (!data || typeof data.phone !== "string") return null;
  // In real mode, discard stale mock sessions so the user sees "未登录"
  if (getPhoneAuthMode() === "real" && data.mockMode !== false) {
    clearPhoneAuth();
    return null;
  }
  return {
    v: 1,
    phone: normalizePhone(data.phone),
    phoneMasked: typeof data.phoneMasked === "string" && data.phoneMasked ? data.phoneMasked : maskPhone(data.phone),
    nickname: typeof data.nickname === "string" && data.nickname.trim() ? data.nickname.trim() : "词源用户",
    avatar: typeof data.avatar === "string" ? data.avatar : "词",
    authMode: data.authMode === "sms" ? "sms" : "mock",
    mockMode: data.mockMode !== false,
    lastLoginAt: typeof data.lastLoginAt === "number" ? data.lastLoginAt : Date.now(),
  };
}

export function savePhoneAuth(state: Omit<SavedPhoneAuthState, "v">): SavedPhoneAuthState {
  const next: SavedPhoneAuthState = {
    v: 1,
    ...state,
    phone: normalizePhone(state.phone),
    phoneMasked: state.phoneMasked || maskPhone(state.phone),
    nickname: state.nickname?.trim() || "词源用户",
    avatar: state.avatar || "词",
  };
  safeSetJson(PHONE_AUTH_KEY, next);
  return next;
}

export function clearPhoneAuth(): void {
  safeSetJson(PHONE_AUTH_KEY, null);
}

export function buildMockUid(phone: string): string {
  const normalized = normalizePhone(phone);
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash + normalized.charCodeAt(i)) | 0;
  }
  return `mock_phone_${Math.abs(hash).toString(36)}`;
}

export function buildMockCloudSession(state: SavedPhoneAuthState): MockCloudSession {
  const phone = normalizePhone(state.phone);
  return {
    uid: buildMockUid(phone),
    phone,
    phoneMasked: state.phoneMasked || maskPhone(phone),
    nickname: state.nickname?.trim() || `词源用户${phone.slice(-4)}`,
    avatar: state.avatar || "词",
    loginType: "MOCK_PHONE",
    authMode: "mock",
    mockMode: true,
    lastLoginAt: state.lastLoginAt || Date.now(),
  };
}

export async function sendPhoneCode(phone: string): Promise<SendCodeResult> {
  const normalized = normalizePhone(phone);
  if (!isValidChinaPhone(normalized)) {
    throw new Error("请输入正确的手机号");
  }

  const mode = getPhoneAuthMode();

  // ── Real mode: CloudBase JS SDK v3 OTP ──────────────────────────────
  if (mode === "real") {
    try {
      const auth = await getCloudbaseAuth();
      if (typeof auth.signInWithOtp !== "function") {
        throw new Error("当前 SDK 不支持 signInWithOtp，请升级 @cloudbase/js-sdk 到 v3.3+");
      }
      const { data, error } = await auth.signInWithOtp({ phone: `+86${normalized}` });
      if (error) {
        throw new Error(error.message || "验证码发送失败");
      }
      if (!data || typeof data.verifyOtp !== "function") {
        throw new Error("SDK 返回异常，缺少 verifyOtp 方法");
      }
      otpVerifier = data as { verifyOtp: (params: { token: string }) => Promise<unknown> };
      return {
        ok: true,
        mockMode: false,
        message: "验证码已发送",
        expiresInSec: 300,
      };
    } catch (err) {
      otpVerifier = null;
      const detail = err instanceof Error ? err.message : "短信发送失败";
      throw new Error(
        `真实短信登录暂不可用：${detail}。请在 CloudBase 控制台开启手机号登录并配置短信模板，或设置 NEXT_PUBLIC_PHONE_AUTH_MODE=mock 切回测试模式。`
      );
    }
  }

  // ── Mock mode ───────────────────────────────────────────────────────
  let result: SendCodeResult;
  try {
    result = await callCloudbaseHttpFunction<SendCodeResult>("/api/phone-auth-send-code", { phone: normalized });
  } catch {
    result = buildMockSendCodeResult();
  }
  if (!result?.ok) {
    throw new Error(result?.message || "验证码发送失败");
  }
  return result;
}

export async function verifyPhoneCode(params: { phone: string; code: string; nickname?: string }): Promise<SavedPhoneAuthState> {
  const normalized = normalizePhone(params.phone);
  if (!isValidChinaPhone(normalized)) {
    throw new Error("请输入正确的手机号");
  }
  const code = String(params.code || "").trim();
  if (!/^\d{4,6}$/.test(code)) {
    throw new Error("请输入验证码");
  }
  const nickname = String(params.nickname || "").trim();

  const mode = getPhoneAuthMode();

  // ── Real mode: CloudBase JS SDK v3 OTP ──────────────────────────────
  if (mode === "real") {
    try {
      if (!otpVerifier) {
        throw new Error("请先发送验证码");
      }
      const verifier = otpVerifier;
      otpVerifier = null;
      const result = (await verifier.verifyOtp({ token: code })) as Record<string, unknown>;
      const verifyError = (result?.error as { message?: string } | undefined);
      if (verifyError?.message) {
        throw new Error(verifyError.message);
      }

      // Try multiple paths to extract uid
      // Path A: result.data.user.uid
      // Path B: result.data.uid
      // Path C: result.user.uid
      // Path D: result.uid
      let uid = '';
      const rd = (result?.data ?? result) as Record<string, unknown> | undefined;
      uid = String(
        (rd as Record<string, unknown> | undefined)?.user
          ? String(((rd as Record<string, unknown>).user as Record<string, unknown>)?.uid || '')
          : ''
      ) || String(rd?.uid || '') || String((result as Record<string, unknown>)?.user
          ? String(((result as Record<string, unknown>).user as Record<string, unknown>)?.uid || '')
          : ''
      ) || String((result as Record<string, unknown>)?.uid || '');

      // Path E: auth.hasLoginState()
      if (!uid) {
        const auth = await getCloudbaseAuth();
        const ls = auth.hasLoginState() as Record<string, unknown> | null;
        if (ls) {
          uid = String(
            (ls.user as Record<string, unknown> | undefined)?.uid
            || ls.uid
            || ''
          );
        }
      }

      if (!uid) {
        // Log structure keys for debugging (no sensitive values)
        const topKeys = Object.keys(result || {}).join(', ');
        const dataObj = (result as Record<string, unknown>)?.data;
        const dataKeys = dataObj && typeof dataObj === 'object' && !Array.isArray(dataObj)
          ? Object.keys(dataObj as Record<string, unknown>).join(', ')
          : '';
        console.warn('[real-auth] verifyOtp top-level keys:', topKeys || '(none)');
        console.warn('[real-auth] verifyOtp result.data keys:', dataKeys || '(none)');
        try {
          const auth2 = await getCloudbaseAuth();
          const ls2 = auth2.hasLoginState() as Record<string, unknown> | null;
          console.warn('[real-auth] hasLoginState keys:', ls2 ? Object.keys(ls2).join(', ') : 'null');
        } catch { /* ignore */ }
        throw new Error("登录成功但未获取到用户标识，请查看控制台日志");
      }

      return savePhoneAuth({
        phone: normalized,
        phoneMasked: maskPhone(normalized),
        nickname: nickname || `词源用户${normalized.slice(-4)}`,
        avatar: "词",
        authMode: "sms",
        mockMode: false,
        lastLoginAt: Date.now(),
      });
    } catch (err) {
      otpVerifier = null;
      const detail = err instanceof Error ? err.message : "手机号登录失败";
      throw new Error(
        `真实短信登录失败：${detail}。请确认验证码正确，或设置 NEXT_PUBLIC_PHONE_AUTH_MODE=mock 切回测试模式。`
      );
    }
  }

  // ── Mock mode ───────────────────────────────────────────────────────
  let result: VerifyCodeResult;
  try {
    result = await callCloudbaseHttpFunction<VerifyCodeResult>("/api/phone-auth-verify-code", {
      phone: normalized,
      code,
      nickname,
    });
  } catch {
    if (code !== "123456") {
      throw new Error("验证码错误，mock 模式请使用 123456");
    }
    result = buildMockVerifyCodeResult(normalized, nickname);
  }
  if (!result?.ok) {
    throw new Error(result?.message || "登录失败");
  }
  return savePhoneAuth({
    phone: result.profile.phone,
    phoneMasked: result.profile.phoneMasked,
    nickname: result.profile.nickname,
    avatar: result.profile.avatar,
    authMode: result.mockMode ? "mock" : "sms",
    mockMode: !!result.mockMode,
    lastLoginAt: Date.now(),
  });
}
