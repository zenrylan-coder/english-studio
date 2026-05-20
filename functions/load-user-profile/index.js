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
  try {
    const method = String(event.httpMethod || "POST").toUpperCase();
    if (method === "OPTIONS") return { statusCode: 204, headers: corsHeaders, body: "" };
    if (method !== "POST") return response(405, { ok: false, message: "Method Not Allowed" });

    const body = parseBody(event);
    if (!body || typeof body.uid !== "string" || !body.uid) {
      return response(400, { ok: false, message: "uid is required" });
    }

    const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV });
    const db = app.database();

    const result = await db.collection("users").doc(body.uid).get();
    const data = result && result.data && typeof result.data === "object" ? result.data : null;

    if (!data) {
      return response(200, { ok: true, data: null });
    }

    return response(200, {
      ok: true,
      data: {
        uid: data.uid,
        phone: data.phone || "",
        nickname: data.nickname || "词源用户",
        avatar: data.avatar || "词",
        createdAt: data.createdAt || 0,
        lastLoginAt: data.lastLoginAt || 0,
      },
    });
  } catch (err) {
    return response(500, { ok: false, message: String(err?.message || err || "Internal Error"), data: null });
  }
};
