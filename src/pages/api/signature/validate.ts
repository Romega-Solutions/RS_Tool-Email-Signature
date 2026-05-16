import type { APIRoute } from "astro";
import { jsonError, jsonOk, readJson } from "../../../lib/api";
import {
  buildAutomationPayload,
  makeFileName,
  normalizeSignature,
  type SignatureInput,
} from "../../../lib/signature";

export const POST: APIRoute = async ({ request }) => {
  const body = (await readJson(request)) as SignatureInput | null;

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
