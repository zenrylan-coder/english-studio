"use strict";

const CHAT_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const MODEL = "qwen3-asr-flash";

const corsHeaders = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST,OPTIONS",
  "access-control-allow-headers": "content-type",
};

function response(statusCode, payload) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(payload),
  };
}

function tryParseBody(event) {
  if (event && typeof event === "object" && !Array.isArray(event)) {
    if (typeof event.audioDataUrl === "string") {
      return event;
    }
  }

  const rawBody = event?.body;
  if (rawBody && typeof rawBody === "object") {
    return rawBody;
  }
  if (typeof rawBody === "string") {
    const trimmed = rawBody.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  return null;
}

function pickTranscriptContent(data) {
  const raw = data?.choices?.[0]?.message?.content;
  if (Array.isArray(raw)) {
    return raw
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part.text === "string") return part.text;
        return "";
      })
      .join("")
      .trim();
  }
  return typeof raw === "string" ? raw.trim() : "";
}

exports.main = async (event = {}) => {
  const method = String(event.httpMethod || "POST").toUpperCase();

  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: "",
    };
  }

  if (method !== "POST") {
    return response(405, { error: "Method Not Allowed" });
  }

  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return response(500, { error: "Missing DASHSCOPE_API_KEY" });
  }

  const payload = tryParseBody(event);
  const audioDataUrl = typeof payload?.audioDataUrl === "string" ? payload.audioDataUrl.trim() : "";
  if (!audioDataUrl.startsWith("data:audio/")) {
    return response(400, { error: "Invalid audioDataUrl" });
  }

  let upstream;
  try {
    upstream = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: [{ text: "Transcribe the user's speech to plain text only. Return only the transcript, no labels or explanation." }],
          },
          {
            role: "user",
            content: [
              {
                type: "input_audio",
                input_audio: {
                  data: audioDataUrl,
                },
              },
            ],
          },
        ],
        stream: false,
        asr_options: {
          enable_itn: true,
        },
      }),
    });
  } catch (err) {
    return response(502, { error: "Upstream request failed", detail: String(err?.message || err) });
  }

  const text = await upstream.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    return response(upstream.ok ? 502 : upstream.status, {
      error: "Invalid upstream response",
      detail: text.slice(0, 300),
    });
  }

  if (!upstream.ok) {
    const msg = data?.message || data?.error?.message || data?.error || upstream.statusText || "Upstream error";
    return response(502, { error: String(msg), detail: JSON.stringify(data).slice(0, 500) });
  }

  const transcript = pickTranscriptContent(data);
  if (!transcript) {
    return response(502, { error: "Empty transcript" });
  }

  return response(200, { ok: true, text: transcript });
};
