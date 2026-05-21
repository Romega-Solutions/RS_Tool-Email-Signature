import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const baseUrl = (process.env.EMAIL_SIGNATURE_BASE_URL || process.env.BASE_URL || "http://127.0.0.1:3005").replace(
  /\/$/,
  "",
);
const apiKey = process.env.EMAIL_SIGNATURE_API_KEY || process.env.API_KEY || process.env.RS_TOOLS_API_KEY || "";
const requestTimeoutMs = Number.parseInt(process.env.EMAIL_SIGNATURE_MCP_TIMEOUT_MS || "15000", 10);

const signatureInputSchema = z.object({
  name: z.string().min(1).describe("Full name to render in the Romega email signature."),
  title: z.string().min(1).describe("Job title or role."),
  phone: z.string().min(1).describe("Phone number shown in the signature."),
  email: z.string().email().describe("Recipient email address."),
  imageDataUrl: z.string().optional().describe("Optional PNG/JPEG data URL for the profile image."),
  source: z.string().optional().describe("Optional caller/source label for request tracing."),
});

const server = new McpServer(
  {
    name: "romega-email-signature",
    version: "0.1.0",
  },
  {
    instructions:
      "Use these tools to validate, prepare, or send Romega email signature payloads through the configured Email Signature HTTP API. Sending email is a side effect.",
  },
);

function jsonText(value) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

function jsonError(message, details = {}) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ ok: false, service: "email-signature-mcp", error: { message, details } }, null, 2),
      },
    ],
    isError: true,
  };
}

function authHeaders() {
  if (!apiKey) {
    return null;
  }

  return {
    "X-API-Key": apiKey,
  };
}

async function callApi(path, options = {}) {
  const timeoutMs = Number.isFinite(requestTimeoutMs) ? Math.min(Math.max(requestTimeoutMs, 1000), 30000) : 15000;

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    signal: options.signal || AbortSignal.timeout(timeoutMs),
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
  });
  const text = await response.text();
  let body = text;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    return jsonError(`Email Signature API returned HTTP ${response.status}.`, {
      baseUrl,
      path,
      response: body,
    });
  }

  return jsonText(body);
}

async function callJsonApi(path, body, headers = {}) {
  return callApi(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

server.registerTool(
  "get_email_signature_health",
  {
    title: "Get Email Signature Health",
    description: "Check Email Signature API readiness without exposing secret values.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
  },
  async () => callApi("/api/health"),
);

server.registerTool(
  "get_email_signature_schema",
  {
    title: "Get Email Signature Schema",
    description: "Return the public signature field contract and validation hints.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
  },
  async () => callApi("/api/signature/schema"),
);

server.registerTool(
  "validate_email_signature",
  {
    title: "Validate Email Signature",
    description: "Validate a signature profile and return the EasyComms automation payload without sending email.",
    inputSchema: signatureInputSchema,
    annotations: { readOnlyHint: true },
  },
  async (input) => callJsonApi("/api/signature/validate", input),
);

server.registerTool(
  "create_email_signature_payload",
  {
    title: "Create Email Signature Payload",
    description: "Create the protected headless signature payload using X-API-Key auth. Does not send email.",
    inputSchema: signatureInputSchema,
    annotations: { readOnlyHint: true },
  },
  async (input) => {
    const headers = authHeaders();
    if (!headers) {
      return jsonError("EMAIL_SIGNATURE_API_KEY, API_KEY, or RS_TOOLS_API_KEY is required for this tool.", { baseUrl });
    }

    return callJsonApi("/api/signature/headless", input, headers);
  },
);

server.registerTool(
  "send_email_signature",
  {
    title: "Send Email Signature",
    description: "Send the signature email through the configured EasyComms/n8n webhook. This tool sends email.",
    inputSchema: signatureInputSchema,
    annotations: {
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
      readOnlyHint: false,
    },
  },
  async (input) => {
    const headers = authHeaders();
    if (!headers) {
      return jsonError("EMAIL_SIGNATURE_API_KEY, API_KEY, or RS_TOOLS_API_KEY is required to send email.", { baseUrl });
    }

    return callJsonApi("/api/signature/send", input, headers);
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Romega Email Signature MCP server connected to ${baseUrl}`);
}

process.on("SIGINT", async () => {
  await server.close();
  process.exit(0);
});

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
