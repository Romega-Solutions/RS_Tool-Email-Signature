import type { APIRoute } from "astro";
import { jsonError, jsonOk, readJson, requireApiKey } from "../../../lib/api";
import {
  buildAutomationPayload,
  makeFileName,
  normalizeSignature,
  signatureSchema,
  type SignatureInput,
} from "../../../lib/signature";

export const GET: APIRoute = (context) => {
  const denied = requireApiKey(context);
  if (denied) return denied;

  return jsonOk({
    contract: signatureSchema,
    endpoints: [
      { method: "GET", path: "/api/health", auth: "public" },
      { method: "GET", path: "/api/signature/schema", auth: "public" },
      { method: "POST", path: "/api/signature/validate", auth: "public" },
      { method: "POST", path: "/api/signature/send", auth: "public-ui-or-X-API-Key" },
      { method: "GET", path: "/api/signature/headless", auth: "X-API-Key" },
      { method: "POST", path: "/api/signature/headless", auth: "X-API-Key" },
    ],
    responseShape: {
      success: { ok: true, service: "email-signature", version: "0.1.0", data: {} },
      failure: { ok: false, service: "email-signature", version: "0.1.0", error: {} },
    },
  });
};

export const POST: APIRoute = async (context) => {
  const denied = requireApiKey(context);
  if (denied) return denied;

  const body = (await readJson(context.request)) as SignatureInput | null;

  if (!body) {
    return jsonError(400, "BAD_JSON", "Request body must be valid JSON.");
  }

  const normalized = normalizeSignature(body);

  if (!normalized.ok) {
    return jsonError(422, "VALIDATION_ERROR", "Signature profile is invalid.", normalized.errors);
  }

  return jsonOk({
    profile: normalized.profile,
    fileName: makeFileName(normalized.profile),
    automationPayload: buildAutomationPayload(normalized.profile, body),
  });
};
