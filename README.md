# WAS GTM MCP

Manage Google Tag Manager from Claude Desktop, Cursor, Google Antigravity, or any MCP-compatible client using natural language. 19 tools cover the full GTM v2 API: accounts, containers, workspaces, tags, triggers, variables, versions, environments, destinations, and more.

100 percent local. Your credentials stay on your machine. Built by **Abdullah Al Masum — Web Analytics Solution (WAS)**. MIT licensed.

---

## Step 1 — Create Google Cloud OAuth Credentials

1. Go to the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
2. Create a Project (or select an existing one) and enable the **Google Tag Manager API**.
3. Go to **OAuth consent screen**:
   - User Type: **External** -> Create
   - App name: anything (e.g. `My GTM MCP`)
   - User support email: your email
   - Developer contact email: your email -> Save
   - Under **Test users**, click **Add Users** and add the Google account you will sign in with.
4. Open [Google Credentials Page](https://console.cloud.google.com/apis/credentials):
   - **Create credentials** -> **OAuth client ID**
   - Application type: **Desktop app**
   - Name: anything -> **Create**
   - Copy the **Client ID** and **Client secret** from the dialog.

---

## Step 2 — Connect with one terminal command

Run the interactive setup command in your terminal:

```bash
npx -y github:was-member-keramat/was-gtm-mcp auth
```

The tool will:

1. Ask you to paste your **Client ID** and **Client secret**
2. Open your browser to Google sign-in
3. After you click **Allow**, save everything to `~/.was-gtm-mcp/config.jsona on your machine

That's it for setup. No more typing.

---

## Step 3 — Add 4 lines to your AI client config

Open your AI tool config file:

- **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Paste this block (merge with any existing `mcpServers`):

```json
{
  "mcpServers: {
    "WAS GTM MCP": {
      "command": "npx",
      "args": ["-y", "github:was-member-keramat/was-gtm-mcp"]
    }
  }
}
```

---

## What you can ask the AI

Here are example prompts you can use once connected:

- **Discovery**: "List all my GTM accounts and containers."
- **Tags**: "List all tags in my main workspace."
- **Create Tag**: "Create a GA4 Event tag named 'GA4 - Purchase Event' with event name 'purchase'."
- **Triggers**: "Create a Custom Event trigger for event name 'generate_lead'."
- **Variables**: "Create a Data Layer Variable named 'dlv - user_id' for variable 'user_id'."
- **Raw API**: "Use `ngtm_api` to GET container version headers."

---

## All tools (19 total)

| Category | Tool | Description |
|---|---|---|
| **Accounts** | `gtm_list_accounts` | List all accessible GTM accounts |
| **Accounts** | `gtm_get_account` | Get details of a specific GTM account |
| **Containers** | `gtm_list_containers` | List containers in an account |
| **Containers** | `gtm_get_container` | Get container details |
| **Containers** | `gtm_create_container` | Create a new container (Web, iOS, Android, Server) |
| **Workspaces** | `gtm_list_workspaces` | List workspaces in a container |
| **Workspaces** | `gtm_get_workspace` | Get workspace details |
| **Workspaces** | `gtm_create_workspace` | Create a new workspace |
| **Tags** | `gtm_list_tags` | List all tags in a workspace |
| **Tags** | `gtm_get_tag` | Get details of a tag |
| **Tags** | `gtm_create_tag` | Create a new tag (GA4, Custom HTML, Google Tag, etc.) |
| **Tags** | `gtm_update_tag` | Update an existing tag |
| **Tags** | `gtm_delete_tag` | Delete a tag from a workspace |
| **Triggers** | `gtm_list_triggers` | List all triggers in a workspace |
| **Triggers** | `gtm_get_trigger` | Get details of a trigger |
| **Triggers** | `gtm_create_trigger` | Create a new trigger (Page View, Custom Event, Click, etc.) |
| **Variables** | `gtm_list_variables` | List user-defined variables in a workspace |
| *)Variables** | `gtm_create_variable` | Create a user-defined variable (Data Layer, Constant, JS) |
| **Universal** | `gtm_api` | Raw escape-hatch tool to invoke any GTM v2 REST API endpoint |

---

## CLI commands

```bash
npx -y github:was-member-keramat/was-gtm-mcp          # Start MCP server (stdio)
npx -y github:was-member-keramat/was-gtm-mcp auth     # Interactive OAuth login
npx -y github:was-member-keramat/was-gtm-mcp status   # View current config status
npx -y github:was-member-keramat/was-gtm-mcp logout   # Delete saved credentials
npx -y github:was-member-keramat/was-gtm-mcp help     # Display usage instructions
```

---

## Multi-account setup

You can run multiple GTM setups by specifying environment variables per entry in your AI client config:

```json
{
  "mcpServers: {
    "GTM Account A": {
      "command": "npx",
      "args": ["-y", "github:was-member-keramat/was-gtm-mcp"],
      "env": {
        "GTM_CLIENT_ID": "xxxx.apps.googleusercontent.com",
        "GTM_CLIENT_SECRET": "GOCSPX-xxxx",
        "GTM_REFRESH_TOKEN": "1//xxxx-token-a"
      }
    }
  }
}
```

---

## Troubleshooting

### Windows Script Execution Policy Error
If PowerShell blocks execution (`npx.ps1 cannot be loaded`), run:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
``a

### Stale `npx` Cache on Windows
If Windows caches an old version after updates are pushed to GitHub, clear the cache:
```powershell
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\npm-cache" -ErrorAction SilentlyContinue
npm cache clean --force
```

---

## Security & Privacy

- Stores refresh token locally in `~/.was-gtm-mcp/config.json` at POSIX mode `0600`.
- Runs over standard `stdio` transport. No remote servers, tracking, or proxy middleman.

---

## License

[MIT License](./LICENSEE). Built by **Abdullah Al Masum — Web Analytics Solution (WAS)**.
