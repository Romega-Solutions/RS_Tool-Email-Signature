# RS Email Signature Creator

Internal Romega Solutions tool for generating branded email signatures and handing signature delivery to EasyComms/n8n automation.

## Status

The app is now a server-deployable Astro 5 project with an Org Chart-style headless API contract:

- UI preview and PNG download still work in the browser.
- `Send to Email` posts to the same-origin `/api/signature/send` endpoint.
- EasyComms/n8n secrets stay server-side.
- Headless automation endpoints use `X-API-Key`, matching the Org Chart integration pattern.

## Stack

| Area | Value |
|---|---|
| Framework | Astro 5 + React + Tailwind |
| Runtime | Astro server output with `@astrojs/node` standalone adapter |
| Package manager | npm |
| Dev port | 4321 |
| Automation | EasyComms/n8n webhook proxy |

## Commands

```bash
npm install
npm run dev
npm run build
npm start
npm run qa:headless
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
| `EMAIL_SIGNATURE_WEBHOOK_URL` | Optional | Backward-compatible webhook env name. |
| `EMAIL_SIGNATURE_WEBHOOK_TOKEN` | Optional | Backward-compatible webhook token env name. |
| `EMAIL_SIGNATURE_ALLOWED_DOMAINS` | Optional | Comma-separated public UI recipient domains. Defaults to `romega-solutions.com`. |
| `PUBLIC_EMAIL_SIGNATURE_BASE_URL` | Optional | External base URL for docs/scripts. |

Do not use `PUBLIC_` variables for webhook URLs or tokens. The browser should call this app, and this app should call EasyComms/n8n.

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
- [Current TODO/status](TODO.md)
