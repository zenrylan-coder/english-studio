const API_PATH_SUFFIX = "/api/qwen-ai-asr";

function resolveQwenSpeechToTextApiUrl(): string {
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

type QwenAsrReply = {
  ok?: boolean;
  text?: string;
  error?: string;
  detail?: string;
};

export async function requestQwenSpeechToText(params: {
  audioDataUrl: string;
  mimeType?: string;
}): Promise<string> {
  const res = await fetch(resolveQwenSpeechToTextApiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  let data: QwenAsrReply = {};
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid JSON from ASR API");
  }

  const text = typeof data.text === "string" ? data.text.trim() : "";
  if (!res.ok || !data?.ok || !text) {
    throw new Error(data?.error || data?.detail || `ASR request failed: ${res.status}`);
  }
  return text;
}
