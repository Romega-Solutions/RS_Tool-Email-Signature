const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4321";
const apiKey = process.env.EMAIL_SIGNATURE_API_KEY || process.env.API_KEY || "qa-email-signature-key";

const sampleProfile = {
  name: "QA User",
  title: "Operations Coordinator",
  phone: "+63 900 000 0000",
  email: "qa@romega-solutions.com",
  imageDataUrl: "data:image/png;base64,cWE=",
  source: "qa-headless",
};

const results = [];

function record(name, status, details) {
  results.push({ name, status, details });
  const icon = status === "pass" ? "PASS" : "FAIL";
  console.log(`[${icon}] ${name}: ${details}`);
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  let body = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return { response, body };
}

async function main() {
  const health = await request("/api/health");
  if (health.response.ok && health.body?.ok && health.body?.data?.headlessApi === true) {
    record("health", "pass", "Headless health endpoint is available.");
  } else {
    record("health", "fail", `Unexpected health response: HTTP ${health.response.status}`);
  }

  if (
    health.response.ok &&
    health.body?.data?.apiKeyConfigured === true &&
    typeof health.body?.data?.webhookTimeoutMs === "number"
  ) {
    record("health-readiness", "pass", "Health endpoint exposes non-secret readiness metadata.");
  } else {
    record("health-readiness", "fail", "Health response is missing API key or webhook timeout readiness metadata.");
  }

  const schema = await request("/api/signature/schema");
  const fields = schema.body?.data?.fields?.map((field) => field.name).join(",");
  if (schema.response.ok && fields === "name,title,phone,email") {
    record("schema", "pass", "Signature schema exposes the expected fields.");
  } else {
    record("schema", "fail", `Unexpected schema fields: ${fields || "missing"}`);
  }

  const validate = await request("/api/signature/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sampleProfile),
  });

  if (validate.response.ok && validate.body?.data?.automationPayload?.event === "email_signature.send_requested") {
    record("validate", "pass", "Validation returns the EasyComms automation payload.");
  } else {
    record("validate", "fail", `Unexpected validation response: HTTP ${validate.response.status}`);
  }

  const metadata = validate.body?.data?.automationPayload?.metadata;
  if (
    metadata?.schemaVersion === "2026-05-17" &&
    metadata?.requestId &&
    metadata?.hasImage === true &&
    metadata?.imageSizeBytes === 2
  ) {
    record("payload-metadata", "pass", "Automation payload includes request tracing and asset metadata.");
  } else {
    record("payload-metadata", "fail", `Unexpected payload metadata: ${JSON.stringify(metadata)}`);
  }

  const deniedHeadless = await request("/api/signature/headless");
  if (deniedHeadless.response.status === 401) {
    record("headless-auth-required", "pass", "Headless contract rejects missing X-API-Key.");
  } else {
    record("headless-auth-required", "fail", `Expected 401, got HTTP ${deniedHeadless.response.status}`);
  }

  const headless = await request("/api/signature/headless", {
    headers: { "X-API-Key": apiKey },
  });

  if (headless.response.ok && headless.body?.data?.contract?.automation?.authHeader === "X-API-Key") {
    record("headless-contract", "pass", "Protected headless contract works with X-API-Key.");
  } else {
    record("headless-contract", "fail", `Unexpected protected contract response: HTTP ${headless.response.status}`);
  }

  const publicSend = await request("/api/signature/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sampleProfile),
  });

  if (publicSend.response.ok || publicSend.response.status === 503) {
    const detail = publicSend.response.ok
      ? "Send endpoint delivered to configured automation."
      : "Send endpoint is wired and correctly reports missing EasyComms webhook config.";
    record("send-endpoint", "pass", detail);
  } else {
    record("send-endpoint", "fail", `Unexpected send response: HTTP ${publicSend.response.status}`);
  }

  const blockedSend = await request("/api/signature/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...sampleProfile,
      email: "qa@example.com",
    }),
  });

  if (blockedSend.response.status === 403) {
    record("public-domain-guard", "pass", "Public send rejects non-company recipient domains.");
  } else {
    record("public-domain-guard", "fail", `Expected 403, got HTTP ${blockedSend.response.status}`);
  }

  const apiSend = await request("/api/signature/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({
      ...sampleProfile,
      email: "qa@example.com",
    }),
  });

  if (apiSend.response.ok || apiSend.response.status === 503) {
    record("api-key-send-bypass", "pass", "API-key callers can use the send contract outside the public domain guard.");
  } else {
    record("api-key-send-bypass", "fail", `Unexpected API-key send response: HTTP ${apiSend.response.status}`);
  }

  const failed = results.filter((result) => result.status === "fail");
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

await main();
