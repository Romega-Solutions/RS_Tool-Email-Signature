import type { APIRoute } from "astro";
import { getWebhookTimeoutMs, hasValidApiKey, jsonError, jsonOk, readJson } from "../../../lib/api";
import {
  buildAutomationPayload,
  isAllowedEmailDomain,
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

  const apiCaller = hasValidApiKey(request);

  if (!apiCaller && !isAllowedEmailDomain(normalized.profile.email)) {
    return jsonError(
      403,
      "FORBIDDEN_EMAIL_DOMAIN",
      "Public signature email delivery is restricted to configured company domains.",
      { allowedDomains: process.env.EMAIL_SIGNATURE_ALLOWED_DOMAINS || "romega-solutions.com" },
    );
  }

  const webhookUrl = process.env.EASYCOMMS_WEBHOOK_URL || process.env.EMAIL_SIGNATURE_WEBHOOK_URL;

  if (!webhookUrl) {
    return jsonError(
      503,
      "EASYCOMMS_NOT_CONFIGURED",
      "EASYCOMMS_WEBHOOK_URL or EMAIL_SIGNATURE_WEBHOOK_URL is not configured on the server.",
    );
  }

  const payload = buildAutomationPayload(normalized.profile, body);
  const token = process.env.EASYCOMMS_WEBHOOK_TOKEN || process.env.EMAIL_SIGNATURE_WEBHOOK_TOKEN;
  const timeoutMs = getWebhookTimeoutMs();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-RS-Tool": "RS_Tool-Email-Signature",
    "X-RS-Event": "email_signature.send_requested",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return jsonError(504, "WEBHOOK_TIMEOUT", `EasyComms webhook did not respond within ${timeoutMs}ms.`, {
        timeoutMs,
        requestId: payload.metadata.requestId,
      });
    }

    return jsonError(502, "WEBHOOK_ERROR", "EasyComms webhook request failed.", {
      requestId: payload.metadata.requestId,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    return jsonError(502, "WEBHOOK_ERROR", `EasyComms webhook returned HTTP ${response.status}.`, {
      responsePreview: responseText.slice(0, 500),
      requestId: payload.metadata.requestId,
    });
  }

  return jsonOk({
    deliveredToAutomation: true,
    recipient: payload.recipient,
    fileName: payload.signature.fileName,
    event: payload.event,
    requestId: payload.metadata.requestId,
  });
};
