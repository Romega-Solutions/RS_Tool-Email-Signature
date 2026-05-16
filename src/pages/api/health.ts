import type { APIRoute } from "astro";
import { jsonOk } from "../../lib/api";

export const GET: APIRoute = () => {
  return jsonOk({
    status: "ok",
    app: "RS_Tool-Email-Signature",
    headlessApi: true,
    easyCommsReady: Boolean(process.env.EASYCOMMS_WEBHOOK_URL || process.env.EMAIL_SIGNATURE_WEBHOOK_URL),
    timestamp: new Date().toISOString(),
  });
};
