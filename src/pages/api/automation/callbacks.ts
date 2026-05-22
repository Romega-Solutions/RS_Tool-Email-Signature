import type { APIRoute } from "astro";
import { jsonError, jsonOk, requireApiKey } from "../../../lib/api";
import { listCallbackRecords } from "../../../lib/callback-history";

function parseLimit(url: URL) {
  const rawLimit = url.searchParams.get("limit");
  const parsedLimit = rawLimit ? Number.parseInt(rawLimit, 10) : 100;
  return Number.isFinite(parsedLimit) ? parsedLimit : 100;
}

export const GET: APIRoute = async (context) => {
  const denied = requireApiKey(context);
  if (denied) return denied;

  try {
    const callbacks = await listCallbackRecords(parseLimit(new URL(context.request.url)));
    return jsonOk({
      count: callbacks.length,
      callbacks,
    });
  } catch (error) {
    return jsonError(500, "CALLBACK_HISTORY_ERROR", "Callback history could not be read.", {
      message: error instanceof Error ? error.message : "Unknown callback history error.",
    });
  }
};
