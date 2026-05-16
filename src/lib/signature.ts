export type SignatureInput = {
  name?: unknown;
  title?: unknown;
  phone?: unknown;
  email?: unknown;
  imageDataUrl?: unknown;
  source?: unknown;
};

export type SignatureProfile = {
  name: string;
  title: string;
  phone: string;
  email: string;
};

export type ValidationResult =
  | { ok: true; profile: SignatureProfile }
  | { ok: false; errors: Record<string, string> };

export const signatureSchema = {
  service: "email-signature",
  version: "0.1.0",
  schemaVersion: "2026-05-17",
  fields: [
    { name: "name", type: "string", required: true, maxLength: 80 },
    { name: "title", type: "string", required: true, maxLength: 120 },
    { name: "phone", type: "string", required: true, maxLength: 40 },
    { name: "email", type: "email", required: true, maxLength: 120 },
  ],
  automation: {
    event: "email_signature.send_requested",
    authHeader: "X-API-Key",
    supportedClients: ["rs-tools", "easycomms", "n8n"],
  },
};

const MAX_IMAGE_DATA_URL_LENGTH = 7_500_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";
}

export function normalizeSignature(input: SignatureInput): ValidationResult {
  const profile: SignatureProfile = {
    name: cleanText(input.name, 80),
    title: cleanText(input.title, 120),
    phone: cleanText(input.phone, 40),
    email: cleanText(input.email, 120).toLowerCase(),
  };

  const errors: Record<string, string> = {};

  if (!profile.name) errors.name = "Name is required.";
  if (!profile.title) errors.title = "Title is required.";
  if (!profile.phone) errors.phone = "Phone is required.";
  if (!profile.email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_RE.test(profile.email)) {
    errors.email = "Email must be a valid email address.";
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, profile };
}

export function getAllowedEmailDomains() {
  return (process.env.EMAIL_SIGNATURE_ALLOWED_DOMAINS || "romega-solutions.com")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedEmailDomain(email: string) {
  const domains = getAllowedEmailDomains();
  const emailDomain = email.split("@")[1]?.toLowerCase() || "";
  return domains.length === 0 || domains.includes(emailDomain);
}

export function makeFileName(profile: SignatureProfile) {
  const slug =
    profile.name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .replace(/^_+|_+$/g, "") || "user";

  return `${slug}_email_signature.png`;
}

export function sanitizeImageDataUrl(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("data:image/png;base64,")) {
    return null;
  }

  if (value.length > MAX_IMAGE_DATA_URL_LENGTH) {
    return null;
  }

  return value;
}

function makeRequestId() {
  return typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `sig_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function getImageSizeBytes(imageDataUrl: string | null) {
  if (!imageDataUrl) {
    return 0;
  }

  const base64 = imageDataUrl.split(",", 2)[1] || "";
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

export function buildSignatureHtml(profile: SignatureProfile) {
  return [
    `<strong>${escapeHtml(profile.name)}</strong><br>`,
    `${escapeHtml(profile.title)}<br>`,
    `WhatsApp (PH): ${escapeHtml(profile.phone)}<br>`,
    `<a href="mailto:${escapeAttribute(profile.email)}">${escapeHtml(profile.email)}</a><br>`,
    `<a href="https://www.romega-solutions.com">www.romega-solutions.com</a><br>`,
    `HQ Address (US) 222 Pacific Coast Hwy. #10 in El Segundo, CA 90245`,
  ].join("");
}

export function buildSignatureText(profile: SignatureProfile) {
  return [
    profile.name,
    profile.title,
    `WhatsApp (PH): ${profile.phone}`,
    profile.email,
    "www.romega-solutions.com",
    "HQ Address (US) 222 Pacific Coast Hwy. #10 in El Segundo, CA 90245",
  ].join("\n");
}

export function buildAutomationPayload(profile: SignatureProfile, input: SignatureInput) {
  const imageDataUrl = sanitizeImageDataUrl(input.imageDataUrl);

  return {
    event: "email_signature.send_requested",
    tool: "RS_Tool-Email-Signature",
    service: "email-signature",
    version: "0.1.0",
    metadata: {
      schemaVersion: signatureSchema.schemaVersion,
      requestId: makeRequestId(),
      hasImage: Boolean(imageDataUrl),
      imageSizeBytes: getImageSizeBytes(imageDataUrl),
    },
    requestedAt: new Date().toISOString(),
    source: cleanText(input.source, 80) || "email-signature-ui",
    recipient: {
      email: profile.email,
      name: profile.name,
    },
    signature: {
      ...profile,
      fileName: makeFileName(profile),
      html: buildSignatureHtml(profile),
      text: buildSignatureText(profile),
    },
    assets: {
      imageDataUrl,
    },
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
