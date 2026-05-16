const baseUrl = (process.env.EMAIL_SIGNATURE_BASE_URL || process.env.BASE_URL || "").replace(/\/$/, "");
const apiKey = process.env.EMAIL_SIGNATURE_API_KEY || process.env.API_KEY || process.env.RS_TOOLS_API_KEY || "";

const results = [];

function record(name, status, details, ms = 0) {
  results.push({ name, status, details, ms });
  const suffix = ms ? ` (${ms}ms)` : "";
  console.log(`[${status.toUpperCase()}] ${name}: ${details}${suffix}`);
}

async function request(path, options = {}) {
  const started = Date.now();
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    signal: AbortSignal.timeout(Number(process.env.QA_TIMEOUT_MS || 15000)),
  });
  const text = await response.text();
  let body = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return { response, body, ms: Date.now() - started };
}

if (!baseUrl) {
  console.error("EMAIL_SIGNATURE_BASE_URL or BASE_URL is required.");
  process.exit(2);
}

const home = await request("/");
if (home.response.ok && typeof home.body === "string" && home.body.includes("Send to Email")) {
  record("public-ui", "pass", "Public UI is reachable and includes Send to Email.", home.ms);
} else {
  record("public-ui", "fail", `Unexpected UI response: HTTP ${home.response.status}`, home.ms);
}

const health = await request("/api/health");
if (health.response.ok && health.body?.ok && health.body?.data?.headlessApi === true) {
  const readiness = health.body.data.easyCommsReady ? "EasyComms configured" : "EasyComms not configured";
  record("health", "pass", `Headless API is healthy; ${readiness}.`, health.ms);
} else {
  record("health", "fail", `Unexpected health response: HTTP ${health.response.status}`, health.ms);
}

const schema = await request("/api/signature/schema");
const fields = schema.body?.data?.fields?.map((field) => field.name).join(",");
if (schema.response.ok && fields === "name,title,phone,email") {
  record("schema", "pass", "Signature schema is available.", schema.ms);
} else {
  record("schema", "fail", `Unexpected schema fields: ${fields || "missing"}`, schema.ms);
}

if (!apiKey) {
  record("api-key", "warn", "EMAIL_SIGNATURE_API_KEY/API_KEY not set; skipped protected headless check.");
} else {
  const headless = await request("/api/signature/headless", {
    headers: { "X-API-Key": apiKey },
  });

  if (headless.response.ok && headless.body?.data?.contract?.automation?.authHeader === "X-API-Key") {
    record("headless", "pass", "Protected headless contract works with X-API-Key.", headless.ms);
  } else {
    record("headless", "fail", `Unexpected headless response: HTTP ${headless.response.status}`, headless.ms);
  }
}

const failed = results.filter((result) => result.status === "fail");
const warnings = results.filter((result) => result.status === "warn");

console.log(`\nSummary: ${results.length - failed.length - warnings.length} passed, ${warnings.length} warnings, ${failed.length} failed.`);

if (failed.length > 0) {
  process.exitCode = 1;
}
