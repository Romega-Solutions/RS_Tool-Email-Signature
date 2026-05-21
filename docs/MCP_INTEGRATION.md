# MCP Integration

The Email Signature tool includes a local MCP stdio server at `mcp/email-signature-server.mjs`.
It wraps the existing headless HTTP API instead of reimplementing signature logic.

## Requirements

- A running Email Signature app, usually `http://127.0.0.1:3005` for local QA.
- `EMAIL_SIGNATURE_API_KEY` for protected headless and send tools.
- `EASYCOMMS_WEBHOOK_URL` on the app server when `send_email_signature` should deliver email.

## Commands

```bash
npm run mcp
npm run mcp:smoke
```

`npm run mcp:smoke` starts the MCP server over stdio, lists tools, and calls the read-only health, schema, validate, and protected payload tools. It does not call `send_email_signature`, so it does not send an email during smoke tests.

## Tool Contract

| Tool | Auth | Side effect |
| --- | --- | --- |
| `get_email_signature_health` | none | none |
| `get_email_signature_schema` | none | none |
| `validate_email_signature` | none | none |
| `create_email_signature_payload` | `EMAIL_SIGNATURE_API_KEY` | none |
| `send_email_signature` | optional `EMAIL_SIGNATURE_API_KEY` for API callers | sends email through EasyComms/n8n |

## Production Notes

For production MCP use, set `EMAIL_SIGNATURE_BASE_URL` to the public Email Signature deployment and store `EMAIL_SIGNATURE_API_KEY` in the MCP client's secret storage. If the Vercel deployment is protected or the custom domain routes to another app, MCP clients will receive the same HTTP error as direct API callers.
