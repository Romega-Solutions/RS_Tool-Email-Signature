import type { APIRoute } from "astro";
import { jsonOk } from "../../../lib/api";
import { signatureSchema } from "../../../lib/signature";

export const GET: APIRoute = () => {
  return jsonOk(signatureSchema);
};
