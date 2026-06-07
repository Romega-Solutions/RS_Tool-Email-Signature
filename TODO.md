# RS Email Signature — TODO

> Status: Vercel production is live for UI, health, schema, automation callback surfaces, and outgoing EasyComms send webhook readiness. The custom `tools.romega-solutions.com/email-signature` route is coded in the Org Chart tools-domain router but still fails live with a redirect into `/org-chart/email-signature`.
> Last updated: 2026-06-08

## Done

- [x] Live preview with real-time updates
- [x] Responsive Romega-branded signature card
- [x] Download as PNG with `html-to-image`
- [x] Server-deployable Astro runtime using `@astrojs/node`
- [x] Public health endpoint: `GET /api/health`
- [x] Public schema endpoint: `GET /api/signature/schema`
- [x] Public validation endpoint: `POST /api/signature/validate`
- [x] Public UI send endpoint: `POST /api/signature/send`
- [x] Protected headless endpoint: `GET/POST /api/signature/headless`
- [x] `X-API-Key` support aligned with Org Chart automation patterns
- [x] Timing-safe API key comparison aligned with Org Chart
- [x] EasyComms/n8n webhook forwarding kept server-side
- [x] Non-secret readiness metadata in `GET /api/health`
- [x] Automation payload request IDs and image metadata for n8n traceability
- [x] EasyComms/n8n webhook timeout guard
- [x] Import-ready starter n8n workflow in `n8n-workflows/`
- [x] n8n workflow imported, Gmail credential bound, and activated as `YZk99jBjp49vowWk`
- [x] Dockerfile for server deployment
- [x] Easypanel compose file for server deployment
- [x] API smoke QA script: `npm run qa:headless`
- [x] Production smoke QA script: `npm run qa:weekly-live`
- [x] Astro 6 / Tailwind 4 / Node 22 runtime upgrade to clear the npm security audit
- [x] Fixed `package.json` name
- [x] Vercel server deployment is live at `https://rs-tool-email-signature.vercel.app`
- [x] Production health and automation schema endpoints return HTTP 200 on the Vercel URL
- [x] Production has an API key configured for protected headless/API-key surfaces
- [x] Production has `EASYCOMMS_WEBHOOK_URL` configured and health reports `easyCommsReady:true`

## Remaining

### Deployment

- [x] Configure `EMAIL_SIGNATURE_API_KEY` or shared `API_KEY` in production.
- [x] Configure the n8n production webhook URL for use by deployment docs.
- [x] Configure `EASYCOMMS_WEBHOOK_URL` or `EMAIL_SIGNATURE_WEBHOOK_URL` in production for outgoing send delivery.
- [ ] Configure `EASYCOMMS_WEBHOOK_TOKEN` if the workflow requires bearer auth.
- [x] Deploy as a server app, not static-only hosting.
- [x] Add Org Chart tools-domain routing handoff for `https://tools.romega-solutions.com/email-signature`.
- [ ] Fix the deployed Easypanel/tools-domain runtime so `/email-signature/api/health` resolves to the Email Signature Vercel app instead of `/org-chart/email-signature/api/health`.
- [ ] Run `npm run qa:weekly-live` against the deployed URL with a production API key available.

### EasyComms/n8n

- [x] Create import-ready starter workflow that accepts `email_signature.send_requested`.
- [x] Include a Gmail send node placeholder in `n8n-workflows/email-signature-easycomms.json`.
- [x] Select the live Gmail credential after importing the workflow.
- [ ] Keep the webhook credential in EasyComms/n8n, not in browser-exposed env.
- [ ] Add this tool to the future consolidated RS Tools service registry.

### Team rollout

- [ ] Confirm the standard allowed recipient domains in `EMAIL_SIGNATURE_ALLOWED_DOMAINS`.
- [ ] Share the production tool URL with the team after deployed QA passes.
