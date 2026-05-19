/**
 * CloudBase HTTP → qwen-ai-chat：纯文本多轮对话（密钥只在云函数）。
 * 访问域名规则与 {@see ../voice/qwenAiChat.ts} TTS 一致。
 */
import { buildLocalChatFallbackReply } from "./chatLocal";

const API_PATH_SUFFIX = "/api/qwen-ai-chat";

function shouldUseLocalChatFallback(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";
  return isLocal && !process.env.NEXT_PUBLIC_TCB_API_BASE;
}

export function resolveQwenTextChatApiUrl(): string {
  const override = process.env.NEXT_PUBLIC_TCB_API_BASE;
  if (override) {
    return override.replace(/\/+$/, "") + API_PATH_SUFFIX;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.endsWith(".tcloudbaseapp.com")) {
      const apiHost = host.replace(/\.tcloudbaseapp\.com$/, ".ap-shanghai.app.tcloudbase.com");
      return `${window.location.protocol}//${apiHost}${API_PATH_SUFFIX}`;
    }
  }
  return API_PATH_SUFFIX;
}

export type FreeChatApiTurn = { role: "user" | "assistant"; content: string };

/** 自由聊气泡：text 为英文，cn 为对应中文翻译（用户/AI 均用 cn） */
export type FreeChatMessage = {
  id: number;
  role: "user" | "ai";
  text: string;
  time: string;
  cn?: string;
};

export type FreeChatApiReply = { text: string; cn: string; userCn: string; mode: "remote" | "local" };

export async function requestQwenFreeChat(params: { scene: string; messages: FreeChatApiTurn[] }): Promise<FreeChatApiReply> {
  const latestUser = [...params.messages].reverse().find((m) => m.role === "user")?.content ?? "";
  if (shouldUseLocalChatFallback()) {
    const fallback = buildLocalChatFallbackReply(params.scene, latestUser);
    return { ...fallback, mode: "local" };
  }

  const res = await fetch(resolveQwenTextChatApiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scene: params.scene, messages: params.messages }),
  });

  let data: {
    ok?: boolean;
    text?: string;
    cn?: string;
    userCn?: string;
    error?: string;
    detail?: string;
  } = {};
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid JSON from chat API");
  }

  if (!res.ok || !data?.ok || typeof data.text !== "string" || !data.text.trim()) {
    const msg = data?.error || data?.detail || `Chat request failed: ${res.status}`;
    throw new Error(msg);
  }

  const text = data.text.trim();
  const cn = typeof data.cn === "string" ? data.cn.trim() : "";
  const userCn = typeof data.userCn === "string" ? data.userCn.trim() : "";
  if (!cn || !userCn) {
    throw new Error(data?.detail || data?.error || "Missing Chinese subtitles in chat reply");
  }

  return {
    text,
    cn,
    userCn,
    mode: "remote",
  };
}

export function chatUiToApiMessages(
  messages: Array<Pick<FreeChatMessage, "role" | "text">>,
): FreeChatApiTurn[] {
  const out: FreeChatApiTurn[] = [];
  for (const m of messages) {
    if (m?.role !== "user" && m?.role !== "ai") continue;
    const text = String(m.text ?? "").trim();
    if (!text) continue;
    out.push({
      role: m.role === "ai" ? "assistant" : "user",
      content: text,
    });
  }
  return out.slice(-30);
}
