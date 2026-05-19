"use strict";

const DASHSCOPE_URL =
  "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";
const MODEL = "qwen3-tts-flash";

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

function normalizeGender(g) {
  const s = String(g ?? "").trim();
  if (s === "男声" || s === "男" || /^male$/i.test(s)) return "男声";
  return "女声";
}

function pickVoice(gender) {
  return normalizeGender(gender) === "男声" ? "Ethan" : "Cherry";
}

function resolveVoice(payload) {
  const direct = String(payload?.voice ?? "").trim();
  if (direct === "Cherry" || direct === "Ethan") return direct;
  return pickVoice(payload?.gender);
}

async function fetchAudioBase64(url) {
  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Audio fetch failed: ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const mimeType = res.headers.get("content-type") || "audio/mpeg";
  return {
    mimeType,
    audioBase64: Buffer.from(arrayBuffer).toString("base64"),
  };
}

function tryParseBody(event) {
  if (event && typeof event === "object" && !Array.isArray(event)) {
    if (typeof event.text === "string") {
      return event;
    }
  }

  const rawBody = event?.body;
  if (rawBody && typeof rawBody === "object") {
    return rawBody;
  }

  if (typeof rawBody === "string") {
    let trimmed = rawBody.trim();
    if (event?.isBase64Encoded && trimmed) {
      try {
        trimmed = Buffer.from(trimmed, "base64").toString("utf8").trim();
      } catch {
        // keep trimmed
      }
    }
    if (!trimmed) return {};
    try {
      return JSON.parse(trimmed);
    } catch {
      const params = new URLSearchParams(trimmed);
      if (params.has("text")) {
        return {
          text: params.get("text") || "",
          gender: params.get("gender") || "女声",
        };
      }
    }
  }

  return null;
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
  if (!payload) {
    return response(400, { error: "Invalid JSON body" });
  }

  const text = String(payload.text || "").trim();
  if (!text) {
    return response(400, { error: "Missing text" });
  }

  const voice = resolveVoice(payload);

  try {
    const dashscopeRes = await fetch(DASHSCOPE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        input: {
          text,
          voice,
          language_type: "English",
        },
      }),
    });

    const data = await dashscopeRes.json();
    const audio = data?.output?.audio;
    if (!dashscopeRes.ok || !audio?.url) {
      return response(dashscopeRes.status || 502, {
        error: data?.message || "DashScope TTS failed",
        code: data?.code || "DASHSCOPE_ERROR",
      });
    }

    // Force HTTPS so audio plays from an HTTPS-hosted page without mixed-content blocking.
    const httpsUrl =
      typeof audio.url === "string" && audio.url.startsWith("http://")
        ? "https://" + audio.url.slice("http://".length)
        : audio.url;

    const fetched = await fetchAudioBase64(httpsUrl);

    return response(200, {
      ok: true,
      url: httpsUrl,
      mimeType: fetched.mimeType,
      audioBase64: fetched.audioBase64,
      id: audio.id,
      expiresAt: audio.expires_at,
      voice,
      model: MODEL,
    });
  } catch (error) {
    return response(500, {
      error: error instanceof Error ? error.message : "Unknown server error",
    });
  }
};
