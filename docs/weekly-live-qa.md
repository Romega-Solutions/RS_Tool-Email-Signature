# Weekly Live QA

Use this checklist to keep Email Signature aligned with the Org Chart readiness pattern.

## Scope

Weekly QA checks the deployed UI, public health/schema endpoints, protected headless contract, and local MCP wrapper. The MCP smoke runs against the same configured base URL but does not send email.

## Required Environment

```powershell
$env:EMAIL_SIGNATURE_BASE_URL="https://tools.romega-solutions.com/email-signature"
$env:EMAIL_SIGNATURE_API_KEY="<production API key>"
```

Use `https://tools.romega-solutions.com/email-signature` for current production QA. It redirects through the Org Chart tools-domain handoff to the Vercel Email Signature app.

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

## Current Evidence

As of 2026-06-08 PHT, `https://rs-tool-email-signature.vercel.app` is publicly reachable, and the Org Chart tools-domain router contains the `/email-signature` handoff.

The production health endpoint reports `easyCommsReady:true` and `webhookConfigured:true`, so `/api/signature/send` can forward to the configured EasyComms/n8n webhook.

The custom tools-domain route is live. On 2026-06-08 PHT, `https://tools.romega-solutions.com/email-signature/api/health` redirected to the Vercel app and returned HTTP 200 with `easyCommsReady:true`; `npm run qa:weekly-live` against the custom URL passed public UI, health, and schema checks.

Protected live QA is the only remaining manual-gated check. On 2026-06-08 PHT, the default QA key was rejected with HTTP 401, confirming production is not using the public local smoke key. Vercel CLI also rejected attempts to add a controlled production `RS_TOOLS_API_KEY` with `Additional permissions are required to create production environment variables.` To complete this check, run the command above with the existing production API key or grant production-env write permission and redeploy after adding `RS_TOOLS_API_KEY`.
