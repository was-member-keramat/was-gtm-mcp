# Changelog

All notable changes to `was-gtm-mcp` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0 — 2026-07-28

### Initial Release

- **WAS GTM MCP Server**: Shareable, cross-platform Model Context Protocol server exposing 19 Google Tag Manager v2 tools over `stdio`.
- **OAuth 2.0 Auth CLI**: Interactive OAuth Desktop app credential setup via `was-gtm-mcp auth`, with local `0600` secret storage in `~/.was-gtm-mcp/config.json`.
- **Windows Node 24+ Compatibility**: `pathToFileURL` dynamic import wrapping to eliminate Windows ESM URL scheme errors.
- **GTM v2 Tools**:
  - `gtm_list_accounts`, `gtm_get_account`
  - `gtm_list_containers`, `gtm_get_container`, `gtm_create_container`
  - `gtm_list_workspaces`, `gtm_get_workspace`, `gtm_create_workspace`
  - `gtm_list_tags`, `gtm_get_tag`, `gtm_create_tag`, `gtm_update_tag`, `gtm_delete_tag`
  - `gtm_list_triggers`, `gtm_get_trigger`, `gtm_create_trigger`
  - `gtm_list_variables`, `gtm_create_variable`
  - `gtm_api` (Universal GTM REST API caller)
