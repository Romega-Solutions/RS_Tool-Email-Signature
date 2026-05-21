import type { APIRoute } from "astro";
import { fetchOrgChartPeople } from "../../../lib/org-chart-client";

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

export const GET: APIRoute = async () => {
  const result = await fetchOrgChartPeople();

  return new Response(JSON.stringify(result), { status: 200, headers });
};
