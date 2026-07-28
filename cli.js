#!/usr/bin/env node

/**
 * WAS GTM MCP — CLI router
 *
 *   was-gtm-mcp          Start the MCP server (used by AI client via stdio)
 *   was-gtm-mcp auth     Connect / re-connect Google credentials
 *   was-gtm-mcp logout   Delete saved credentials
 *   was-gtm-mcp status   Show whether credentials are saved and when
 *   was-gtm-mcp help     Show usage
 */

import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { CONFIG_FILE } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cmd = (process.argv[2] || '').toLowerCase();

// CRITICAL: EVERY dynamic import() MUST be wrapped in pathToFileURL(...).href
// Otherwise Windows Node 24+ throws ERR_UNSUPPORTED_ESM_URL_SCHEME

if (cmd === 'auth') {
  const { runAuthFlow } = await import(pathToFileURL(join(__dirname, 'auth.js')).href);
  try {
    await runAuthFlow();
    process.exit(0);
  } catch (err) {
    console.error('\nAuth failed:', err?.message || err);
    process.exit(1);
  }
} else if (cmd === 'logout') {
  const { deleteConfigFile } = await import(pathToFileURL(join(__dirname, 'auth.js')).href);
  const deleted = await deleteConfigFile();
  console.log(deleted ? `Removed ${CONFIG_FILE}` : 'No saved credentials to remove.');
  process.exit(0);
} else if (cmd === 'status') {
  const { readConfigFile } = await import(pathToFileURL(join(__dirname, 'auth.js')).href);
  const cfg = await readConfigFile();
  if (!cfg) {
    console.log('Not configured. Run `npx -y github:was-member-keramat/was-gtm-mcp auth` to connect.');
  } else {
    console.log(`Config: ${CONFIG_FILE}`);
    console.log(`Saved:  ${cfg.saved_at || '(unknown)'}`);
  }
  process.exit(0);
} else if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
  console.log(`
WAS GTM MCP — CLI

Usage:
  npx -y github:was-member-keramat/was-gtm-mcp          Start MCP server (stdio)
  npx -y github:was-member-keramat/was-gtm-mcp auth     Connect / re-connect credentials
  npx -y github:was-member-keramat/was-gtm-mcp status   Show config summary
  npx -y github:was-member-keramat/was-gtm-mcp logout   Delete saved credentials
  npx -y github:was-member-keramat/was-gtm-mcp help     Show this help message

Environment variable overrides (take precedence over saved config):
  GTM_CLIENT_ID                      OAuth Client ID
  GTM_CLIENT_SECRET                  OAuth Client Secret
  GTM_REFRESH_TOKEN                  OAuth Refresh Token

Requires Node 18+.
`);
  process.exit(0);
} else {
  // Default action: start the MCP stdio server
  await import(pathToFileURL(join(__dirname, 'server.js')).href);
}
