# Weekly Live QA

Use this checklist to keep Email Signature aligned with the Org Chart readiness pattern.

## Scope

Weekly QA checks the deployed UI, public health/schema endpoints, protected headless contract, and local MCP wrapper. The MCP smoke runs against the same configured base URL but does not send email.

## Required Environment

```powershell
$env:EMAIL_SIGNATURE_BASE_URL="https://rs-tool-email-signature.vercel.app"
$env:EMAIL_SIGNATURE_API_KEY="<production API key>"
```

Use `https://rs-tool-email-signature.vercel.app` for current production QA. The planned custom tools route is `https://tools.romega-solutions.com/email-signature`, but it is not mapped to this app yet.

## Commands

```powershell
npm run qa:weekly-live
npm run mcp:smoke
```

For local verification:

```powershell
$env:EMAIL_SIGNATURE_BASE_URL="http://127.0.0.1:3005"
$env:BASE_URL="http://127.0.0.1:3005"
$env:EMAIL_SIGNATURE_API_KEY="local-email-signature-key"
npm run qa:headless
npm run mcp:smoke
```

## Pass Criteria

- Public UI returns `200` and includes the Send to Email workflow.
- `/api/health` returns `headlessApi: true`.
- `/api/signature/schema` exposes `name,title,phone,email`.
- Protected `/api/signature/headless` accepts `X-API-Key`.
- MCP exposes the expected five tools:
  - `get_email_signature_health`
  - `get_email_signature_schema`
  - `validate_email_signature`
  - `create_email_signature_payload`
  - `send_email_signature`

## Known External Blockers

As of 2026-06-08 PHT, `https://rs-tool-email-signature.vercel.app` is publicly reachable, and the Org Chart tools-domain router contains the `/email-signature` handoff.

The production health endpoint reports `easyCommsReady:true` and `webhookConfigured:true`, so `/api/signature/send` can forward to the configured EasyComms/n8n webhook. A full protected live QA still needs `EMAIL_SIGNATURE_API_KEY` or a shared `API_KEY` in the local shell.
