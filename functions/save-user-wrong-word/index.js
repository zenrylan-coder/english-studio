"use strict";

const cloudbase = require("@cloudbase/node-sdk");

const corsHeaders = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization",
};

function response(statusCode, payload) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(payload),
  };
}

function parseBody(event) {
  if (event && typeof event === "object" && event.uid && !event.body) return event;
  const rawBody = event?.body;
  if (rawBody && typeof rawBody === "object") return rawBody;
  if (typeof rawBody === "string" && rawBody.trim()) {
    try { return JSON.parse(rawBody); } catch { return null; }
  }
  return null;
}

exports.main = async (event = {}) => {
  const method = String(event.httpMethod || "POST").toUpperCase();
  if (method === "OPTIONS") return { statusCode: 204, headers: corsHeaders, body: "" };
  if (method !== "POST") return response(405, { ok: false, message: "Method Not Allowed" });

  const body = parseBody(event);
  if (!body || typeof body.uid !== "string" || !body.uid) {
    return response(400, { ok: false, message: "uid is required" });
  }
  if (!body.bankId || !body.word) {
    return response(400, { ok: false, message: "bankId and word are required" });
  }

  try {
    const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV });
    const db = app.database();

    const word = String(body.word).trim().toLowerCase();
    const docId = `${body.uid}__${body.bankId}__${word}`;
    const doc = {
      uid: body.uid,
      word,
      bankId: body.bankId,
      reason: String(body.reason || "待补充"),
      createdAt: typeof body.createdAt === "number" ? body.createdAt : Date.now(),
      updatedAt: typeof body.updatedAt === "number" ? body.updatedAt : Date.now(),
    };
    await db.collection("user_wrong_words").doc(docId).set(doc);
    return response(200, { ok: true });
  } catch (err) {
    return response(500, { ok: false, message: String(err?.message || err || "Internal Error") });
  }
};
