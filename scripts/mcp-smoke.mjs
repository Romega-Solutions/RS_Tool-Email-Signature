import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolve } from "node:path";

const baseUrl = process.env.EMAIL_SIGNATURE_BASE_URL || process.env.BASE_URL || "http://127.0.0.1:3005";
const apiKey = process.env.EMAIL_SIGNATURE_API_KEY || process.env.API_KEY || "qa-email-signature-key";
const serverPath = resolve("mcp/email-signature-server.mjs");
const smokeTimeoutMs = Number.parseInt(process.env.MCP_SMOKE_TIMEOUT_MS || "30000", 10);

const expectedTools = [
  "get_email_signature_health",
  "get_email_signature_schema",
  "validate_email_signature",
  "create_email_signature_payload",
  "send_email_signature",
];

const sampleProfile = {
  name: "QA MCP User",
  title: "Operations Coordinator",
  phone: "+63 900 000 0000",
  email: "qa@romega-solutions.com",
  imageDataUrl: "data:image/png;base64,cWE=",
  source: "mcp-smoke",
};

function parseToolJson(result) {
  const text = result.content
    ?.filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  if (!text) {
    throw new Error("Tool returned no text content.");
  }

  return JSON.parse(text);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function withTimeout(promise, label) {
  const timeoutMs = Number.isFinite(smokeTimeoutMs) ? Math.min(Math.max(smokeTimeoutMs, 5000), 60000) : 30000;

  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms.`)), timeoutMs);
    }),
  ]);
}

async function main() {
  const client = new Client({ name: "email-signature-mcp-smoke", version: "1.0.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    env: {
      ...process.env,
      EMAIL_SIGNATURE_BASE_URL: baseUrl,
      EMAIL_SIGNATURE_API_KEY: apiKey,
    },
  });

  await withTimeout(client.connect(transport), "MCP connect");

  try {
    const { tools } = await withTimeout(client.listTools(), "MCP tools/list");
    const toolNames = tools.map((tool) => tool.name).sort();

    for (const expectedTool of expectedTools) {
      assert(toolNames.includes(expectedTool), `Missing MCP tool: ${expectedTool}`);
    }

    const health = parseToolJson(
      await withTimeout(client.callTool({ name: "get_email_signature_health", arguments: {} }), "health tool"),
    );
    assert(health.ok === true, "Health tool did not return ok=true.");
    assert(health.data?.headlessApi === true, "Health tool did not expose headlessApi=true.");

    const schema = parseToolJson(
      await withTimeout(client.callTool({ name: "get_email_signature_schema", arguments: {} }), "schema tool"),
    );
    const fields = schema.data?.fields?.map((field) => field.name).join(",");
    assert(fields === "name,title,phone,email", `Schema fields mismatch: ${fields}`);

    const validation = parseToolJson(
      await withTimeout(
        client.callTool({
          name: "validate_email_signature",
          arguments: sampleProfile,
        }),
        "validate tool",
      ),
    );
    assert(
      validation.data?.automationPayload?.event === "email_signature.send_requested",
      "Validate tool did not return the EasyComms automation payload.",
    );

    const payload = parseToolJson(
      await withTimeout(
        client.callTool({
          name: "create_email_signature_payload",
          arguments: sampleProfile,
        }),
        "headless payload tool",
      ),
    );
    assert(payload.data?.fileName?.endsWith(".png"), "Headless payload tool did not return a PNG filename.");

    console.log(
      JSON.stringify(
        {
          ok: true,
          baseUrl,
          tools: toolNames,
          requestId: payload.data?.automationPayload?.metadata?.requestId,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.close();
  }
}

await main();
