import type { APIRoute } from "astro";

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const exampleEnvelope = {
  event: "email_signature.send_requested",
  sourceTool: "RS_Tool-Email-Signature",
  version: "1.0",
  requestId: "sig_20260521_example",
  occurredAt: "2026-05-21T00:00:00.000Z",
  actor: { type: "api", name: "API Integration" },
  data: {
    name: "Jane Doe",
    title: "Operations Manager",
    email: "jane@romega-solutions.com",
  },
};

const automationSchema = {
  service: "email-signature",
  sourceTool: "RS_Tool-Email-Signature",
  version: "1.0",
  auth: {
    header: "X-API-Key",
    envVars: ["EMAIL_SIGNATURE_API_KEY", "API_KEY", "RS_TOOLS_API_KEY", "RS_TOOL_API_KEY"],
  },
  staffDirectory: {
    consumes: "org-chart",
    localEndpoint: "/api/org-chart/people",
  },
  inboundEvents: [
    "org_chart.people.snapshot_ready",
    "email_signature.send_requested",
    "email_signature.delivery.status_updated",
  ],
  outboundEvents: ["email_signature.send_requested"],
  callbackEndpoints: [
    {
      event: "email_signature.delivery.status_updated",
      method: "POST",
      path: "/api/automation/callback",
      auth: "X-API-Key",
    },
    {
      event: "email_signature.delivery.status_updated",
      method: "GET",
      path: "/api/automation/callbacks",
      auth: "X-API-Key",
      purpose: "Recent persisted delivery status callback history.",
      storage: "n8n_data_table_with_local_json_fallback",
    },
  ],
  auditHistory: {
    storage: "n8n_data_table_with_local_json_fallback",
    envVars: ["N8N_URL", "N8N_API_KEY", "N8N_AUDIT_TABLE_ID"],
  },
  webhookReady: true,
  n8n: {
    envVars: ["N8N_WEBHOOK_URL", "N8N_API_KEY"],
  },
  exampleEnvelope,
};

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(automationSchema), { status: 200, headers });
};
