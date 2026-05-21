import type { APIRoute } from "astro";

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const exampleEnvelope = {
  event: "email_signature.send_requested",
  service: "email-signature",
  sourceTool: "RS_Tool-Email-Signature",
  version: "1.0",
  requestedAt: "2026-05-21T00:00:00.000Z",
  staffProfile: {
    name: "KEN PATRICK GARCIA",
    title: "FULL STACK DEVELOPER",
    email: "name@romega-solutions.com",
    phone: "+63 991 xxx xxxx",
  },
  delivery: {
    webhookUrlEnvVar: "N8N_WEBHOOK_URL",
  },
};

const automationSchema = {
  service: "email-signature",
  sourceTool: "RS_Tool-Email-Signature",
  version: "1.0",
  auth: {
    header: "X-API-Key",
    envVars: ["RS_TOOL_API_KEY"],
  },
  staffDirectory: {
    consumes: "org-chart",
    localEndpoint: "/api/org-chart/people",
  },
  inboundEvents: ["email_signature.send_requested"],
  outboundEvents: ["email_signature.send_requested"],
  webhookReady: true,
  n8n: {
    envVars: ["N8N_WEBHOOK_URL", "N8N_API_KEY"],
  },
  exampleEnvelope,
};

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(automationSchema), { status: 200, headers });
};
