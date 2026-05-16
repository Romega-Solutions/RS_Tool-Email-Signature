# RS Email Signature Creator

Internal Romega Solutions tool for generating branded email signatures and handing signature delivery to EasyComms/n8n automation.

## Status

The app is now a server-deployable Astro 6 project with an Org Chart-style headless API contract:

- UI preview and PNG download still work in the browser.
- `Send to Email` posts to the same-origin `/api/signature/send` endpoint.
- EasyComms/n8n secrets stay server-side.
- Headless automation endpoints use `X-API-Key`, matching the Org Chart integration pattern.

## Stack

| Area | Value |
|---|---|
| Framework | Astro 6 + React + Tailwind 4 |
| Runtime | Astro server output with `@astrojs/node` standalone adapter |
| Package manager | npm |
| Node.js | 22 LTS or newer |
| Dev port | 4321 |
| Automation | EasyComms/n8n webhook proxy |
| Container | Dockerfile for standalone Astro server deployment |

## Commands

```bash
npm install
npm run dev
npm run build
npm audit --audit-level=moderate
npm start
npm run qa:headless
npm run qa:weekly-live
```

For local API QA with protected routes:

```bash
$env:EMAIL_SIGNATURE_API_KEY="local-email-signature-key"
npm run build
npm start
```

In another terminal:

```bash
$env:EMAIL_SIGNATURE_API_KEY="local-email-signature-key"
npm run qa:headless
```

## Environment

Copy `.env.example` to `.env` or configure the same values in the deployment platform.

| Variable | Required | Purpose |
|---|---:|---|
| `EMAIL_SIGNATURE_API_KEY` | Yes for headless API | API key for `X-API-Key` callers. |
| `API_KEY` | Optional | Shared RS Tools fallback key for consistency with Org Chart. |
| `RS_TOOLS_API_KEY` | Optional | Future consolidated RS Tools fallback key. |
| `EASYCOMMS_WEBHOOK_URL` | Yes for email delivery | Server-side EasyComms/n8n webhook target. |
| `EASYCOMMS_WEBHOOK_TOKEN` | Optional | Bearer token sent to EasyComms/n8n. |
| `EASYCOMMS_WEBHOOK_TIMEOUT_MS` | Optional | EasyComms/n8n request timeout. Defaults to `10000`, clamped to 1-30 seconds. |
| `EMAIL_SIGNATURE_WEBHOOK_TIMEOUT_MS` | Optional | Backward-compatible timeout env name. |
| `EMAIL_SIGNATURE_WEBHOOK_URL` | Optional | Backward-compatible webhook env name. |
| `EMAIL_SIGNATURE_WEBHOOK_TOKEN` | Optional | Backward-compatible webhook token env name. |
| `EMAIL_SIGNATURE_ALLOWED_DOMAINS` | Optional | Comma-separated public UI recipient domains. Defaults to `romega-solutions.com`. |
| `PUBLIC_EMAIL_SIGNATURE_BASE_URL` | Optional | External base URL for docs/scripts. |

Do not use `PUBLIC_` variables for webhook URLs or tokens. The browser should call this app, and this app should call EasyComms/n8n.

## Docker

```bash
docker build -t rs-email-signature .
docker run --rm -p 4321:4321 \
  -e EMAIL_SIGNATURE_API_KEY=replace-with-generated-api-key \
  -e EASYCOMMS_WEBHOOK_URL=https://n8n.example.com/webhook/email-signature \
  rs-email-signature
```

## Easypanel Deployment

Deploy this as a server app, not static hosting. The repo includes `docker-compose.easypanel.yml` for Easypanel-style deployment:

```bash
docker compose -f docker-compose.easypanel.yml up -d --build
```

Production env values:

```text
EMAIL_SIGNATURE_API_KEY=<generated API key>
EASYCOMMS_WEBHOOK_URL=https://n8n-romega-n8n.ikuuwb.easypanel.host/webhook/rs-email-signature
EASYCOMMS_WEBHOOK_TOKEN=<optional bearer token>
EASYCOMMS_WEBHOOK_TIMEOUT_MS=10000
EMAIL_SIGNATURE_ALLOWED_DOMAINS=romega-solutions.com
PUBLIC_EMAIL_SIGNATURE_BASE_URL=https://tools.romega-solutions.com/email-signature
```

The service health check calls `GET /api/health`.

## Production QA

Run the live smoke script against the deployed URL:

```bash
$env:EMAIL_SIGNATURE_BASE_URL="https://tools.romega-solutions.com/email-signature"
$env:EMAIL_SIGNATURE_API_KEY="<production API key>"
npm run qa:weekly-live
```

It checks the public UI, health API, schema API, and protected headless contract when an API key is present.

## Current n8n Workflow

The EasyComms workflow has been imported and activated in n8n:

| Field | Value |
|---|---|
| Workflow | `RS Email Signature EasyComms` |
| Workflow ID | `YZk99jBjp49vowWk` |
| Production webhook | `https://n8n-romega-n8n.ikuuwb.easypanel.host/webhook/rs-email-signature` |
| Gmail credential | `Gmail account` |

Set `EASYCOMMS_WEBHOOK_URL` on the deployed Email Signature app to the production webhook above.

## Headless API

All responses use the shared shape:

```json
{
  "ok": true,
  "service": "email-signature",
  "version": "0.1.0",
  "data": {}
}
```

Errors return:

```json
{
  "ok": false,
  "service": "email-signature",
  "version": "0.1.0",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Signature profile is invalid."
  }
}
```

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | Public | Runtime health and EasyComms readiness. |
| `GET` | `/api/signature/schema` | Public | Signature field schema and automation metadata. |
| `POST` | `/api/signature/validate` | Public | Validate a signature profile and build the automation payload. |
| `POST` | `/api/signature/send` | Public UI or `X-API-Key` | Forward a send request to EasyComms/n8n. |
| `GET` | `/api/signature/headless` | `X-API-Key` | Integration contract for RS Tools, EasyComms, and n8n. |
| `POST` | `/api/signature/headless` | `X-API-Key` | Build a normalized signature payload without sending email. |

Example:

```bash
curl -X POST http://localhost:4321/api/signature/headless \
  -H "Content-Type: application/json" \
  -H "X-API-Key: local-email-signature-key" \
  -d '{"name":"Jane Doe","title":"Operations Manager","phone":"+63 900 000 0000","email":"jane@romega-solutions.com"}'
```

## EasyComms Payload

`/api/signature/send`, `/api/signature/validate`, and `/api/signature/headless` produce the same automation payload:

```json
{
  "event": "email_signature.send_requested",
  "tool": "RS_Tool-Email-Signature",
  "service": "email-signature",
  "version": "0.1.0",
  "metadata": {
    "schemaVersion": "2026-05-17",
    "requestId": "generated-request-id",
    "hasImage": true,
    "imageSizeBytes": 123456
  },
  "recipient": {
    "email": "jane@romega-solutions.com",
    "name": "Jane Doe"
  },
  "signature": {
    "name": "Jane Doe",
    "title": "Operations Manager",
    "phone": "+63 900 000 0000",
    "email": "jane@romega-solutions.com",
    "fileName": "jane_doe_email_signature.png",
    "html": "...",
    "text": "..."
  },
  "assets": {
    "imageDataUrl": "data:image/png;base64,..."
  }
}
```

This keeps the Email Signature tool ready to communicate with future consolidated RS Tools while leaving email delivery owned by EasyComms/n8n.

## Documentation

- [EasyComms and n8n setup](docs/N8N_SETUP_GUIDE.md)
- [n8n workflow setup](n8n-workflows/SETUP.md)
- [Import-ready EasyComms workflow](n8n-workflows/email-signature-easycomms.json)
- [Current TODO/status](TODO.md)
