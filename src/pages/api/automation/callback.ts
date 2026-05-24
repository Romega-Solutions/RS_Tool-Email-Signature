import type { APIRoute } from "astro";
import { jsonError, jsonOk, readJson, requireApiKey } from "../../../lib/api";
import {
  allowedCallbackStatuses,
  appendCallbackRecord,
  type CallbackStatus,
  type EmailSignatureCallbackBody,
} from "../../../lib/callback-history";

const allowedEvents = new Set(["email_signature.delivery.status_updated"]);
const allowedStatuses = new Set<string>(allowedCallbackStatuses);

export const POST: APIRoute = async (context) => {
  const denied = requireApiKey(context);
  if (denied) return denied;

  const body = (await readJson(context.request)) as EmailSignatureCallbackBody | null;

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

  let persistence;
  try {
    persistence = await appendCallbackRecord(body, status as CallbackStatus);
  } catch (error) {
    return jsonError(500, "CALLBACK_HISTORY_ERROR", "Callback was valid but could not be persisted.", {
      message: error instanceof Error ? error.message : "Unknown callback history error.",
    });
  }

  return jsonOk({
    accepted: true,
    event: body.event,
    requestId: typeof body.requestId === "string" ? body.requestId : null,
    acceptedStatus: status,
    signatureId: typeof body.data?.signatureId === "string" ? body.data.signatureId : null,
    persisted: true,
    record: persistence.record,
    persistence: {
      durable: persistence.durable,
      storage: persistence.storage,
    },
  });
};
