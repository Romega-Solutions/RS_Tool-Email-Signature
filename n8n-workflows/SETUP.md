# n8n Setup: RS Email Signature Send

This folder contains the recommended import-ready EasyComms/n8n workflow:

```text
n8n-workflows/email-signature-easycomms.json
```

The workflow receives the `email_signature.send_requested` event from the Email Signature app, validates the payload, sends through a Gmail node, and responds to the app. Select the live Gmail or SMTP credential after import.

Current live n8n workflow:

```text
Workflow name: RS Email Signature EasyComms
Workflow ID: YZk99jBjp49vowWk
Production webhook: https://n8n-romega-n8n.ikuuwb.easypanel.host/webhook/rs-email-signature
Gmail credential: Gmail account
Status: Active
```

## Import With CLI

The installed CLI command on this machine is `n8n-cli`.

```powershell
n8n-cli login
n8n-cli workflow create .\n8n-workflows\email-signature-easycomms.json
```

After import:

1. Open the workflow in n8n.
2. Select the Gmail/SMTP credential on `Send Signature Email`.
3. Confirm the message fields use `recipient.email`, `subject`, `message`, and optional `imageDataUrl` from the validated payload.
4. Activate the workflow.
5. Copy the production webhook URL into the Email Signature app as `EASYCOMMS_WEBHOOK_URL`.
6. If n8n validates a bearer token, set the token in the app as `EASYCOMMS_WEBHOOK_TOKEN`.

## App Environment

```text
EMAIL_SIGNATURE_API_KEY=<generated API key>
EASYCOMMS_WEBHOOK_URL=https://n8n-romega-n8n.ikuuwb.easypanel.host/webhook/rs-email-signature
EASYCOMMS_WEBHOOK_TOKEN=<optional bearer token>
EASYCOMMS_WEBHOOK_TIMEOUT_MS=10000
EMAIL_SIGNATURE_ALLOWED_DOMAINS=romega-solutions.com
```

Keep webhook URLs and tokens server-side. Do not use `PUBLIC_` variables for this integration.

## Verification

```powershell
$env:EMAIL_SIGNATURE_API_KEY="local-email-signature-key"
$env:EASYCOMMS_WEBHOOK_URL="<production n8n webhook URL>"
npm run build
npm start
```

In another terminal:

```powershell
$env:BASE_URL="http://127.0.0.1:4321"
$env:EMAIL_SIGNATURE_API_KEY="local-email-signature-key"
npm run qa:headless
```

If `EASYCOMMS_WEBHOOK_URL` is not set, `qa:headless` still passes when the send endpoint returns the expected `503 EASYCOMMS_NOT_CONFIGURED` state.
