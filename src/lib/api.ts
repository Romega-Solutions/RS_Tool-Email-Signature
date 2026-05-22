import type { APIContext } from "astro";
import { timingSafeEqual } from "node:crypto";

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

export type ApiErrorCode =
  | "BAD_JSON"
  | "EASYCOMMS_NOT_CONFIGURED"
  | "FORBIDDEN_EMAIL_DOMAIN"
  | "INVALID_API_KEY"
  | "METHOD_NOT_ALLOWED"
  | "VALIDATION_ERROR"
  | "WEBHOOK_ERROR"
  | "WEBHOOK_TIMEOUT";

export function jsonOk(data: unknown, init: ResponseInit = {}) {
  return new Response(
    JSON.stringify({
      ok: true,
      service: "email-signature",
      version: "0.1.0",
      data,
    }),
    {
      ...init,
      status: init.status ?? 200,
      headers: {
        ...jsonHeaders,
        ...init.headers,
      },
    },
  );
}

export function jsonError(status: number, code: ApiErrorCode, message: string, details?: unknown) {
  return new Response(
    JSON.stringify({
      ok: false,
      service: "email-signature",
      version: "0.1.0",
      error: {
        code,
        message,
        details,
      },
    }),
    {
      status,
      headers: jsonHeaders,
    },
  );
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function getConfiguredApiKeys() {
  return [
    process.env.EMAIL_SIGNATURE_API_KEY,
    process.env.API_KEY,
    process.env.RS_TOOLS_API_KEY,
    process.env.RS_TOOL_API_KEY,
  ].filter((value): value is string => Boolean(value?.trim()));
}

export function getWebhookTimeoutMs() {
  const rawValue = process.env.EASYCOMMS_WEBHOOK_TIMEOUT_MS || process.env.EMAIL_SIGNATURE_WEBHOOK_TIMEOUT_MS;
  const parsedValue = rawValue ? Number.parseInt(rawValue, 10) : 10_000;

  if (!Number.isFinite(parsedValue)) {
    return 10_000;
  }

  return Math.min(Math.max(parsedValue, 1_000), 30_000);
}

export function getRequestApiKey(request: Request) {
  return request.headers.get("X-API-Key")?.trim() || "";
}

function safeCompare(a: string, b: string) {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function hasValidApiKey(request: Request) {
  const keys = getConfiguredApiKeys();
  const requestKey = getRequestApiKey(request);
  return keys.length > 0 && requestKey.length > 0 && keys.some((key) => safeCompare(requestKey, key));
}

export function requireApiKey({ request }: APIContext) {
  if (hasValidApiKey(request)) {
    return null;
  }

  const configured = getConfiguredApiKeys().length > 0;
  return jsonError(
    401,
    "INVALID_API_KEY",
    configured
      ? "Send a valid X-API-Key header to use this headless endpoint."
      : "EMAIL_SIGNATURE_API_KEY, API_KEY, RS_TOOLS_API_KEY, or RS_TOOL_API_KEY is not configured on the server.",
  );
}
