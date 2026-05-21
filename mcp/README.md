# Romega Email Signature MCP Server

This MCP server exposes the Email Signature headless HTTP API as local stdio tools.
It does not duplicate signature validation or EasyComms delivery logic; it calls the app endpoints configured by `EMAIL_SIGNATURE_BASE_URL`.

## Tools

- `get_email_signature_health` - checks API readiness.
- `get_email_signature_schema` - returns the public field contract.
- `validate_email_signature` - validates a profile and returns the automation payload without sending email.
- `create_email_signature_payload` - calls the protected headless payload endpoint with `X-API-Key`.
- `send_email_signature` - sends the signature email through EasyComms/n8n.

## Environment

```bash
EMAIL_SIGNATURE_BASE_URL=http://127.0.0.1:3005
EMAIL_SIGNATURE_API_KEY=your-local-or-production-api-key
```

`BASE_URL`, `API_KEY`, and `RS_TOOLS_API_KEY` are accepted fallbacks for local automation.

## Local Run

```bash
npm run mcp
```

For a smoke check against a running app:

```bash
EMAIL_SIGNATURE_BASE_URL=http://127.0.0.1:3005 npm run mcp:smoke
```

## Client Config Example

```json
{
  "mcpServers": {
    "romega-email-signature": {
      "command": "node",
      "args": [
        "C:/Codes Local/__Work-Romega/Work - Romega Projects (Workspace)/RS_Tools/RS_Tool-Email-Signature/mcp/email-signature-server.mjs"
      ],
      "env": {
        "EMAIL_SIGNATURE_BASE_URL": "http://127.0.0.1:3005",
        "EMAIL_SIGNATURE_API_KEY": "set-this-in-your-client-secret-storage"
      }
    }
  }
}
```

Do not commit API key values into client config files.
