# EasyComms and n8n Setup

This Email Signature tool now follows the same integration direction as the RS Org Chart product: browser users call the app, and automation systems call protected headless APIs with `X-API-Key`.

The browser must not call n8n directly with public webhook tokens.

## Runtime Contract

Public app URL:

```text
https://tools.romega-solutions.com/email-signature
```

Local development URL:

```text
http://localhost:4321
```

Required app environment:

```text
EMAIL_SIGNATURE_API_KEY=<generated API key>
EASYCOMMS_WEBHOOK_URL=<EasyComms or n8n webhook URL>
EASYCOMMS_WEBHOOK_TOKEN=<optional bearer token>
EMAIL_SIGNATURE_ALLOWED_DOMAINS=romega-solutions.com
```

The app sends this request to EasyComms/n8n:

```http
POST <EASYCOMMS_WEBHOOK_URL>
Authorization: Bearer <EASYCOMMS_WEBHOOK_TOKEN>
Content-Type: application/json
X-RS-Tool: RS_Tool-Email-Signature
X-RS-Event: email_signature.send_requested
```

## App Endpoints

| Method | Path | Auth | n8n/EasyComms use |
|---|---|---|---|
| `GET` | `/api/health` | Public | Check whether the app is up and webhook env is configured. |
| `GET` | `/api/signature/schema` | Public | Read fields and event metadata. |
| `POST` | `/api/signature/validate` | Public | Validate a payload without sending. |
| `POST` | `/api/signature/send` | Public UI or `X-API-Key` | Send a signature request into EasyComms/n8n. |
| `GET` | `/api/signature/headless` | `X-API-Key` | Read the protected integration contract. |
| `POST` | `/api/signature/headless` | `X-API-Key` | Build a normalized automation payload without sending. |

## n8n Workflow Shape

Create a workflow with:

1. Webhook Trigger
2. Optional auth check if `EASYCOMMS_WEBHOOK_TOKEN` is not handled by n8n credentials
3. Validate required fields:
   - `event`
   - `recipient.email`
   - `signature.name`
   - `signature.title`
   - `signature.phone`
   - `signature.email`
4. Gmail or SMTP node that sends the signature package to `recipient.email`
5. Response node that returns HTTP `200` to the Email Signature app

The webhook response can be minimal:

```json
{
  "ok": true,
  "message": "Signature email queued"
}
```

## Payload Example

```json
{
  "event": "email_signature.send_requested",
  "tool": "RS_Tool-Email-Signature",
  "service": "email-signature",
  "version": "0.1.0",
  "requestedAt": "2026-05-17T00:00:00.000Z",
  "source": "email-signature-ui",
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
    "html": "<strong>Jane Doe</strong><br>...",
    "text": "Jane Doe\nOperations Manager\n..."
  },
  "assets": {
    "imageDataUrl": "data:image/png;base64,..."
  }
}
```

## Headless Test Commands

Health:

```bash
curl http://localhost:4321/api/health
```

Protected contract:

```bash
curl http://localhost:4321/api/signature/headless \
  -H "X-API-Key: local-email-signature-key"
```

Build an automation payload:

```bash
curl -X POST http://localhost:4321/api/signature/headless \
  -H "Content-Type: application/json" \
  -H "X-API-Key: local-email-signature-key" \
  -d '{"name":"Jane Doe","title":"Operations Manager","phone":"+63 900 000 0000","email":"jane@romega-solutions.com"}'
```

Run local QA:

```bash
npm run build
$env:EMAIL_SIGNATURE_API_KEY="local-email-signature-key"
npm start
```

In another terminal:

```bash
$env:BASE_URL="http://127.0.0.1:4321"
$env:EMAIL_SIGNATURE_API_KEY="local-email-signature-key"
npm run qa:headless
```

## Operational Notes

- Deploy this as a server app. Static-only hosting will not run `/api/signature/send`.
- Keep webhook URLs and tokens server-side only.
- Prefer n8n credentials for tokens where possible.
- Public UI send requests are limited by `EMAIL_SIGNATURE_ALLOWED_DOMAINS`.
- API-key callers are intended for trusted RS Tools, EasyComms, and n8n automation.
