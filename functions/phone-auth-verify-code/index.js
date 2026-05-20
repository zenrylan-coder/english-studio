"use strict";

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

function parseBody(event) {
  if (event && typeof event === "object" && typeof event.phone === "string") return event;
  const rawBody = event?.body;
  if (rawBody && typeof rawBody === "object") return rawBody;
  if (typeof rawBody === "string" && rawBody.trim()) {
    try {
      return JSON.parse(rawBody);
    } catch {
      return null;
    }
  }
  return null;
}

function maskPhone(phone) {
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

exports.main = async (event = {}) => {
  const method = String(event.httpMethod || "POST").toUpperCase();
  if (method === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }
  if (method !== "POST") {
    return response(405, { ok: false, message: "Method Not Allowed" });
  }

  const body = parseBody(event);
  const phone = String(body?.phone || "").replace(/\D+/g, "");
  const code = String(body?.code || "").trim();
  const nickname = String(body?.nickname || "").trim() || `词源用户${phone.slice(-4)}`;
  if (!/^1\d{10}$/.test(phone)) {
    return response(400, { ok: false, message: "手机号格式不正确" });
  }
  if (code !== "123456") {
    return response(400, { ok: false, message: "验证码错误，mock 模式请使用 123456" });
  }

  return response(200, {
    ok: true,
    mockMode: true,
    message: "手机号验证成功（mock）",
    profile: {
      phone,
      phoneMasked: maskPhone(phone),
      nickname,
      avatar: "词",
    },
  });
};
