import type { APIRoute } from "astro";
import { jsonError, jsonOk, readJson, requireApiKey } from "../../../lib/api";

const allowedEvents = new Set(["email_signature.delivery.status_updated"]);
const allowedStatuses = new Set(["queued", "sent", "failed", "pending"]);

type CallbackBody = {
  event?: unknown;
  requestId?: unknown;
  occurredAt?: unknown;
  data?: {
    signatureId?: unknown;
    status?: unknown;
    errorMessage?: unknown;
    sentAt?: unknown;
    providerMessageId?: unknown;
  };
};

export const POST: APIRoute = async (context) => {
  const denied = requireApiKey(context);
  if (denied) return denied;

  const body = (await readJson(context.request)) as CallbackBody | null;

  if (!body) {
    return jsonError(400, "BAD_JSON", "Request body must be valid JSON.");
  }

  if (typeof body.event !== "string" || !allowedEvents.has(body.event)) {
    return jsonError(400, "UNSUPPORTED_EVENT", "Callback event is not supported.", {
      allowedEvents: Array.from(allowedEvents),
    });
  }

  const status = body.data?.status;

  if (typeof status !== "string" || !allowedStatuses.has(status)) {
    return jsonError(422, "VALIDATION_ERROR", "Callback status is invalid.", {
      allowedStatuses: Array.from(allowedStatuses),
    });
  }

  return jsonOk({
    accepted: true,
    event: body.event,
    requestId: typeof body.requestId === "string" ? body.requestId : null,
    acceptedStatus: status,
    signatureId: typeof body.data?.signatureId === "string" ? body.data.signatureId : null,
    persisted: false,
  });
};
