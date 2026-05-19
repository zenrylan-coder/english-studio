const CHAT_STORAGE_KEY = "english-studio.v2.ai-chat-messages";
const CHAT_SESSIONS_KEY = "english-studio.v2.ai-chat-sessions";
const CHAT_CURRENT_SESSION_KEY = "english-studio.v2.ai-chat-current-session-id";

export type V2ChatMessage = {
  id: number;
  role: "ai" | "user";
  text: string;
  cn: string;
  time: string;
};

export type LocalChatFallbackReply = {
  text: string;
  cn: string;
  userCn: string;
};

export type V2ChatSession = {
  id: string;
  title: string;
  updatedAt: number;
  messages: V2ChatMessage[];
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeChatMessageIds(messages: V2ChatMessage[]): V2ChatMessage[] {
  const seen = new Set<number>();
  let nextId = messages.reduce((max, item) => Math.max(max, Number(item?.id ?? 0) || 0), 0);
  return messages.map((item) => {
    const id = Number(item.id);
    if (Number.isFinite(id) && !seen.has(id)) {
      seen.add(id);
      return item;
    }
    nextId += 1;
    seen.add(nextId);
    return { ...item, id: nextId };
  });
}

function buildSessionTitle(messages: V2ChatMessage[]): string {
  const firstUser = messages.find((item) => item.role === "user" && item.text.trim());
  if (!firstUser) return "新对话";
  const text = firstUser.text.trim();
  return text.length > 20 ? `${text.slice(0, 20)}...` : text;
}

function normalizeChatSession(session: V2ChatSession): V2ChatSession {
  const messages = normalizeChatMessageIds((session.messages || []).slice(-24));
  return {
    id: String(session.id || `chat-${Date.now()}`),
    title: buildSessionTitle(messages),
    updatedAt: Number(session.updatedAt || Date.now()),
    messages,
  };
}

function buildSeedSession(defaultMessages: V2ChatMessage[]): V2ChatSession {
  return {
    id: `chat-${Date.now()}`,
    title: "新对话",
    updatedAt: Date.now(),
    messages: normalizeChatMessageIds(defaultMessages.slice(-24)),
  };
}

export function loadChatMessages(defaultMessages: V2ChatMessage[]): V2ChatMessage[] {
  if (!canUseStorage()) return defaultMessages;
  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return defaultMessages;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultMessages;
    return normalizeChatMessageIds(
      parsed
      .filter(
        (item) =>
          item &&
          typeof item.id === "number" &&
          (item.role === "ai" || item.role === "user") &&
          typeof item.text === "string" &&
          typeof item.cn === "string" &&
          typeof item.time === "string",
      )
      .slice(-24),
    );
  } catch {
    return defaultMessages;
  }
}

export function saveChatMessages(messages: V2ChatMessage[]) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(normalizeChatMessageIds(messages.slice(-24))));
  } catch {
    // ignore
  }
}

export function loadChatSessions(defaultMessages: V2ChatMessage[]): { sessions: V2ChatSession[]; currentSessionId: string } {
  const fallback = buildSeedSession(defaultMessages);
  if (!canUseStorage()) {
    return { sessions: [fallback], currentSessionId: fallback.id };
  }
  try {
    const raw = window.localStorage.getItem(CHAT_SESSIONS_KEY);
    const current = window.localStorage.getItem(CHAT_CURRENT_SESSION_KEY)?.trim() || "";
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const sessions = parsed
          .filter((item) => item && typeof item === "object" && Array.isArray(item.messages))
          .map((item) => normalizeChatSession(item as V2ChatSession))
          .sort((a, b) => b.updatedAt - a.updatedAt);
        const currentSessionId = sessions.some((item) => item.id === current) ? current : sessions[0].id;
        return { sessions, currentSessionId };
      }
    }

    const legacy = loadChatMessages(defaultMessages);
    const seed = normalizeChatSession({ ...fallback, messages: legacy });
    return { sessions: [seed], currentSessionId: seed.id };
  } catch {
    return { sessions: [fallback], currentSessionId: fallback.id };
  }
}

export function saveChatSessions(sessions: V2ChatSession[], currentSessionId: string) {
  if (!canUseStorage()) return;
  try {
    const normalized = sessions
      .map((item) => normalizeChatSession(item))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 16);
    window.localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(normalized));
    window.localStorage.setItem(CHAT_CURRENT_SESSION_KEY, currentSessionId);
    const current = normalized.find((item) => item.id === currentSessionId) ?? normalized[0];
    if (current) {
      saveChatMessages(current.messages);
    }
  } catch {
    // ignore
  }
}

export function createChatSession(defaultMessages: V2ChatMessage[]): V2ChatSession {
  return buildSeedSession(defaultMessages);
}

export function buildLocalChatFallbackReply(scene: string, userText: string): LocalChatFallbackReply {
  const raw = String(userText ?? "").trim();
  const brief = raw.length > 120 ? `${raw.slice(0, 117)}...` : raw;
  const scoped = scene && scene !== "自由聊天"
    ? `Let's stay in the ${scene} scenario.`
    : "Let's keep the conversation going in English.";

  return {
    text: `Got it. ${scoped} You said: "${brief}". Could you add one more detail or ask me a follow-up question?`,
    cn: `本地模式：我先用离线回复陪你练习。你刚才说的是“${brief}”。请再补充一个细节，或者继续追问我。`,
    userCn: "本地模式：当前未接入在线翻译，已保留你的英文原句用于继续练习。",
  };
}
