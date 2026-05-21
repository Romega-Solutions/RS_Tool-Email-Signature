# Weekly Live QA

Use this checklist to keep Email Signature aligned with the Org Chart readiness pattern.

## Scope

Weekly QA checks the deployed UI, public health/schema endpoints, protected headless contract, and local MCP wrapper. The MCP smoke runs against the same configured base URL but does not send email.

## Required Environment

```powershell
$env:EMAIL_SIGNATURE_BASE_URL="https://tools.romega-solutions.com/email-signature"
$env:EMAIL_SIGNATURE_API_KEY="<production API key>"
```

Use the actual Email Signature deployment URL when the custom tools route is not yet mapped to this app.

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

## Known External Blocker

As of the current local verification, the custom production route `https://tools.romega-solutions.com/email-signature` redirects into the Org Chart route and returns `404`. The latest Email Signature Vercel deployment is also protected by Vercel auth in the available account context. Local and CI smoke can pass, but live public QA remains blocked until the Vercel routing/auth context is corrected.
