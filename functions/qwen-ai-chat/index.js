"use strict";

/** DashScope OpenAI-compatible chat (Qwen) */
const CHAT_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const MODEL = "qwen-plus";

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
    if (Array.isArray(event.messages)) {
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

function buildSystemPrompt(scene) {
  const sceneLine = scene && String(scene).trim() ? String(scene).trim() : "自由聊天";
  return [
    "You are a warm, patient English conversation partner for Chinese learners.",
    `Practice scene (may be Chinese label): ${sceneLine}. Reply naturally in English; keep encouraging.`,
    "OUTPUT RULE: Output exactly ONE JSON object and nothing else. No markdown, no code fences, no prose before or after.",
    'Keys (all required strings, UTF-8):',
    '  "userCn" — natural S mainland Chinese meaning of the USER\'s latest English message (the sentence you answer).',
    '  "en" — your English reply (1–4 short sentences).',
    '  "cn" — natural S mainland Chinese translation of "en" (same meaning as en).',
    "Do not omit userCn or cn. Escape line breaks as \\n inside strings if needed.",
  ].join("\n");
}

function stripCodeFences(s) {
  let t = String(s || "").trim();
  if (!t) return "";
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  }
  return t;
}

function tryParseJsonLoose(s) {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    try {
      return JSON.parse(s.replace(/,\s*([}\]])/g, "$1"));
    } catch {
      return null;
    }
  }
}

function extractFirstJsonObject(s) {
  const start = s.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

function pickString(o, keys) {
  if (!o || typeof o !== "object") return "";
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/** Parse model output; never treat garbage as valid en without cn/userCn when avoidable */
function parseModelJsonContent(raw) {
  let s = stripCodeFences(raw);
  if (!s) {
    return { en: "", cn: "", userCn: "" };
  }

  let o = tryParseJsonLoose(s);
  if (!o) {
    const slice = extractFirstJsonObject(s);
    if (slice) o = tryParseJsonLoose(slice);
  }

  if (o && typeof o === "object" && !Array.isArray(o)) {
    const inner = o.reply || o.data || o.result;
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      o = { ...o, ...inner };
    }
    const en = pickString(o, ["en", "text", "reply", "answer", "english"]);
    const cn = pickString(o, ["cn", "zh", "chinese", "zh_cn", "translation"]);
    const userCn = pickString(o, ["userCn", "user_cn", "userZh", "user_zh", "userTranslation"]);
    if (en) return { en, cn, userCn };
  }

  return { en: "", cn: "", userCn: "" };
}

function lastUserEnglishFromBody(bodyMessages) {
  for (let i = bodyMessages.length - 1; i >= 1; i--) {
    if (bodyMessages[i].role === "user") return bodyMessages[i].content || "";
  }
  return "";
}

async function translateLineToZh(apiKey, englishLine) {
  const line = String(englishLine || "").trim();
  if (!line) return "";
  const msgs = [
    {
      role: "system",
      content:
        'You are a translator. Translate the user message to natural Simplified Chinese. Output only one JSON object with a single key "zh" (string). Example: {"zh":"你好"}',
    },
    { role: "user", content: line },
  ];
  const withFmt = {
    model: MODEL,
    messages: msgs,
    temperature: 0.15,
    response_format: { type: "json_object" },
  };
  let resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(withFmt),
  });
  let text = await resp.text();
  if (!resp.ok) {
    resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages: msgs, temperature: 0.15 }),
    });
    text = await resp.text();
  }
  let d;
  try {
    d = JSON.parse(text);
  } catch {
    return "";
  }
  if (!resp.ok) return "";
  const raw = stripCodeFences(d?.choices?.[0]?.message?.content);
  const slice = extractFirstJsonObject(raw) || raw;
  const o = tryParseJsonLoose(slice);
  return pickString(o || {}, ["zh", "cn", "text"]);
}

function normalizeMessages(messages, systemPrompt) {
  const out = [{ role: "system", content: systemPrompt }];
  if (!Array.isArray(messages)) return out;

  for (const m of messages) {
    if (!m || typeof m !== "object") continue;
    const role = m.role === "assistant" ? "assistant" : m.role === "user" ? "user" : null;
    if (!role) continue;
    const content = typeof m.content === "string" ? m.content.trim() : "";
    if (!content) continue;
    out.push({ role, content });
  }

  /** Cap turns to reduce payload; keep system + most recent user/assistant */
  const MAX_TURNS = 32;
  if (out.length > MAX_TURNS + 1) {
    const sys = out[0];
    const rest = out.slice(1).slice(-MAX_TURNS);
    return [sys, ...rest];
  }
  return out;
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
  if (!payload || !Array.isArray(payload.messages)) {
    return response(400, { error: "Invalid JSON body: need messages[]" });
  }

  const scene = typeof payload.scene === "string" ? payload.scene : "自由聊天";
  const bodyMessages = normalizeMessages(payload.messages, buildSystemPrompt(scene));

  if (bodyMessages.length < 2) {
    return response(400, { error: "No user/assistant messages to reply to" });
  }

  const requestBodyWithFmt = {
    model: MODEL,
    messages: bodyMessages,
    temperature: 0.45,
    response_format: { type: "json_object" },
  };

  let upstream;
  try {
    upstream = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBodyWithFmt),
    });
  } catch (err) {
    return response(502, { error: "Upstream request failed", detail: String(err?.message || err) });
  }

  let text = await upstream.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = {};
  }

  if (!upstream.ok) {
    try {
      upstream = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: bodyMessages,
          temperature: 0.4,
        }),
      });
      text = await upstream.text();
      try {
        data = JSON.parse(text);
      } catch {
        return response(502, {
          error: "Invalid upstream response after retry",
          detail: text.slice(0, 500),
        });
      }
    } catch (err) {
      const msg = data?.message || data?.error?.message || data?.error || upstream.statusText || String(err?.message || err);
      return response(502, { error: String(msg), code: data?.code });
    }
  }

  if (!upstream.ok) {
    const msg = data?.message || data?.error?.message || data?.error || upstream.statusText || "Upstream error";
    return response(502, { error: String(msg), code: data?.code });
  }

  let rawContent = data?.choices?.[0]?.message?.content;
  let { en, cn, userCn } = parseModelJsonContent(rawContent);

  /** Second parse pass: plain text JSON from models that ignore response_format */
  if (!en || !cn || !userCn) {
    try {
      const retry = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: bodyMessages,
          temperature: 0.35,
        }),
      });
      const retryText = await retry.text();
      const retryData = JSON.parse(retryText);
      if (retry.ok) {
        rawContent = retryData?.choices?.[0]?.message?.content;
        const second = parseModelJsonContent(rawContent);
        if (second.en) {
          en = second.en;
          if (!cn) cn = second.cn;
          if (!userCn) userCn = second.userCn;
        }
      }
    } catch {
      // keep first parse
    }
  }

  const lastUser = lastUserEnglishFromBody(bodyMessages);
  if (en && !userCn && lastUser) {
    userCn = await translateLineToZh(apiKey, lastUser);
  }
  if (en && !cn) {
    cn = await translateLineToZh(apiKey, en);
  }

  if (!en) {
    return response(502, { error: "Empty or unparseable model reply", detail: String(rawContent || "").slice(0, 200) });
  }

  if (!cn || !userCn) {
    return response(502, {
      error: "Could not produce Chinese subtitles",
      detail: JSON.stringify({ hasEn: !!en, hasCn: !!cn, hasUserCn: !!userCn }),
    });
  }

  return response(200, { ok: true, text: en, cn, userCn });
};
