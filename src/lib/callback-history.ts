import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const defaultHistoryFile = path.join(process.cwd(), "data", "automation-callbacks.json");
const maxRecords = 500;
const n8nTimeoutMs = 8_000;

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

function getN8nAuditConfig() {
  const url = process.env.N8N_URL?.trim().replace(/\/+$/, "");
  const apiKey = process.env.N8N_API_KEY?.trim();
  const tableId = process.env.N8N_AUDIT_TABLE_ID?.trim();

  if (!url || !apiKey || !tableId) return null;

  return { url, apiKey, tableId };
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
  const durable = await appendN8nCallbackRecord(record);
  return {
    record,
    durable,
    storage: durable ? "n8n_data_table" : "local_json_file",
  };
}

export async function listCallbackRecords(limit = 100) {
  const n8nRecords = await listN8nCallbackRecords(limit);
  if (n8nRecords) return n8nRecords;

  const records = await readAllRecords();
  const safeLimit = Math.min(Math.max(limit, 1), maxRecords);
  return records.slice(-safeLimit).reverse();
}

function toN8nAuditRow(record: CallbackRecord) {
  return {
    eventId: record.id,
    tool: "email-signature",
    event: record.event,
    requestId: record.requestId || "",
    status: record.status,
    receivedAt: record.receivedAt,
    summary: record.signatureId || record.providerMessageId || record.status,
    payload: JSON.stringify(record),
  };
}

async function appendN8nCallbackRecord(record: CallbackRecord) {
  const config = getN8nAuditConfig();
  if (!config) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), n8nTimeoutMs);

  try {
    const response = await fetch(`${config.url}/api/v1/data-tables/${config.tableId}/rows`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-N8N-API-KEY": config.apiKey,
      },
      body: JSON.stringify({ data: [toN8nAuditRow(record)], returnType: "all" }),
      signal: controller.signal,
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function listN8nCallbackRecords(limit: number) {
  const config = getN8nAuditConfig();
  if (!config) return null;

  const safeLimit = Math.min(Math.max(limit, 1), maxRecords);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), n8nTimeoutMs);

  try {
    const url = new URL(`${config.url}/api/v1/data-tables/${config.tableId}/rows`);
    url.searchParams.set("limit", String(safeLimit));
    url.searchParams.set("search", "email-signature");

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-N8N-API-KEY": config.apiKey,
      },
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const body = (await response.json()) as { data?: Array<{ payload?: unknown; tool?: unknown }> };
    const rows = Array.isArray(body.data) ? body.data : [];

    return rows
      .filter((row) => row.tool === "email-signature" && typeof row.payload === "string")
      .map((row) => {
        try {
          return JSON.parse(row.payload as string) as CallbackRecord;
        } catch {
          return null;
        }
      })
      .filter((record): record is CallbackRecord => Boolean(record))
      .slice(0, safeLimit);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
