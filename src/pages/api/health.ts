import type { APIRoute } from "astro";
import { getConfiguredApiKeys, getWebhookTimeoutMs, jsonOk } from "../../lib/api";

export const GET: APIRoute = () => {
  const webhookConfigured = Boolean(process.env.EASYCOMMS_WEBHOOK_URL || process.env.EMAIL_SIGNATURE_WEBHOOK_URL);

  return jsonOk({
    status: "ok",
    app: "RS_Tool-Email-Signature",
    headlessApi: true,
    apiKeyConfigured: getConfiguredApiKeys().length > 0,
    easyCommsReady: webhookConfigured,
    webhookConfigured,
    webhookTimeoutMs: getWebhookTimeoutMs(),
    timestamp: new Date().toISOString(),
  });
};
