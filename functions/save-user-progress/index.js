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

  try {
    const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV });
    const db = app.database();

    // _type: "profile" means upsert to users collection
    if (body._type === "profile") {
      const doc = {
        uid: body.uid,
        phone: String(body.phone || ""),
        nickname: String(body.nickname || "词源用户"),
        avatar: String(body.avatar || "词"),
        createdAt: typeof body.createdAt === "number" ? body.createdAt : Date.now(),
        lastLoginAt: typeof body.lastLoginAt === "number" ? body.lastLoginAt : Date.now(),
      };
      const existing = await db.collection("users").doc(body.uid).get();
      await db.collection("users").doc(body.uid).set({
        ...(existing.data || doc),
        ...doc,
        createdAt: (existing.data && existing.data.createdAt) || doc.createdAt,
      });
      return response(200, { ok: true });
    }

    // Otherwise save to user_progress
    if (!body.bankId) {
      return response(400, { ok: false, message: "bankId is required" });
    }
    const docId = `${body.uid}__${body.bankId}`;
    const doc = {
      uid: body.uid,
      bankId: body.bankId,
      currentIndex: typeof body.currentIndex === "number" ? body.currentIndex : 0,
      knownWords: Array.isArray(body.knownWords) ? body.knownWords : [],
      unknownWords: Array.isArray(body.unknownWords) ? body.unknownWords : [],
      masteredWords: Array.isArray(body.masteredWords) ? body.masteredWords : [],
      updatedAt: typeof body.updatedAt === "number" ? body.updatedAt : Date.now(),
    };
    await db.collection("user_progress").doc(docId).set(doc);
    return response(200, { ok: true });
  } catch (err) {
    return response(500, { ok: false, message: String(err?.message || err || "Internal Error") });
  }
};
