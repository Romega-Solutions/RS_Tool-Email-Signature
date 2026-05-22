import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const defaultHistoryFile = path.join(process.cwd(), "data", "automation-callbacks.json");
const maxRecords = 500;

export const allowedCallbackStatuses = ["queued", "sent", "failed", "pending"] as const;
export type CallbackStatus = (typeof allowedCallbackStatuses)[number];

export type CallbackRecord = {
  id: string;
  event: "email_signature.delivery.status_updated";
  requestId: string | null;
  signatureId: string | null;
  status: CallbackStatus;
  providerMessageId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  occurredAt: string | null;
  receivedAt: string;
  sourceTool: string | null;
};

export type EmailSignatureCallbackBody = {
  event?: unknown;
  requestId?: unknown;
  occurredAt?: unknown;
  sourceTool?: unknown;
  data?: {
    signatureId?: unknown;
    status?: unknown;
    errorMessage?: unknown;
    sentAt?: unknown;
    providerMessageId?: unknown;
  };
};

let writeChain = Promise.resolve();

function getHistoryFile() {
  return process.env.EMAIL_SIGNATURE_CALLBACK_HISTORY_FILE?.trim() || defaultHistoryFile;
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

async function readAllRecords() {
  try {
    const raw = await readFile(getHistoryFile(), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CallbackRecord[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeAllRecords(records: CallbackRecord[]) {
  const file = getHistoryFile();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

export function normalizeCallbackRecord(body: EmailSignatureCallbackBody, status: CallbackStatus): CallbackRecord {
  return {
    id: `sig_cb_${Date.now()}_${randomUUID()}`,
    event: "email_signature.delivery.status_updated",
    requestId: stringOrNull(body.requestId),
    signatureId: stringOrNull(body.data?.signatureId),
    status,
    providerMessageId: stringOrNull(body.data?.providerMessageId),
    errorMessage: stringOrNull(body.data?.errorMessage),
    sentAt: stringOrNull(body.data?.sentAt),
    occurredAt: stringOrNull(body.occurredAt),
    receivedAt: new Date().toISOString(),
    sourceTool: stringOrNull(body.sourceTool),
  };
}

export async function appendCallbackRecord(body: EmailSignatureCallbackBody, status: CallbackStatus) {
  const record = normalizeCallbackRecord(body, status);

  writeChain = writeChain.catch(() => undefined).then(async () => {
    const records = await readAllRecords();
    records.push(record);
    await writeAllRecords(records.slice(-maxRecords));
  });

  await writeChain;
  return record;
}

export async function listCallbackRecords(limit = 100) {
  const records = await readAllRecords();
  const safeLimit = Math.min(Math.max(limit, 1), maxRecords);
  return records.slice(-safeLimit).reverse();
}
