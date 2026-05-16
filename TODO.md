# RS Email Signature — TODO

> Status: Headless API and EasyComms-ready server integration added. Email delivery becomes live after `EASYCOMMS_WEBHOOK_URL` is configured in the deployment environment.
> Last updated: 2026-05-17

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
- [x] Dockerfile for server deployment
- [x] Easypanel compose file for server deployment
- [x] API smoke QA script: `npm run qa:headless`
- [x] Production smoke QA script: `npm run qa:weekly-live`
- [x] Fixed `package.json` name

## Remaining

### Deployment

- [ ] Configure `EMAIL_SIGNATURE_API_KEY` or shared `API_KEY` in production.
- [ ] Configure `EASYCOMMS_WEBHOOK_URL` in production when the EasyComms/n8n workflow is ready.
- [ ] Configure `EASYCOMMS_WEBHOOK_TOKEN` if the workflow requires bearer auth.
- [ ] Deploy as a server app using `Dockerfile` or `docker-compose.easypanel.yml`, not static-only hosting.
- [ ] Run `npm run qa:weekly-live` against the deployed URL.

### EasyComms/n8n

- [x] Create import-ready starter workflow that accepts `email_signature.send_requested`.
- [x] Include a Gmail send node placeholder in `n8n-workflows/email-signature-easycomms.json`.
- [ ] Select the live Gmail/SMTP credential after importing the workflow.
- [ ] Keep the webhook credential in EasyComms/n8n, not in browser-exposed env.
- [ ] Add this tool to the future consolidated RS Tools service registry.

### Team rollout

- [ ] Confirm the standard allowed recipient domains in `EMAIL_SIGNATURE_ALLOWED_DOMAINS`.
- [ ] Share the production tool URL with the team after deployed QA passes.
