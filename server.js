#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { CONFIG_FILE, DEFAULT_BASE_URL } from './config.js';
import { TOKEN_URL } from './oauth-config.js';

// Load saved config
let saved = {};
try {
  saved = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
} catch {}

const CLIENT_ID = process.env.GTM_CLIENT_ID || saved.client_id;
const CLIENT_SECRET = process.env.GTM_CLIENT_SECRET || saved.client_secret;
const REFRESH_TOKEN = process.env.GTM_REFRESH_TOKEN || saved.refresh_token;
const BASE_URL = (process.env.GTM_BASE_URL || saved.base_url || DEFAULT_BASE_URL).replace(/\/+$/, '');

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error(
    'WAS GTM MCP — not configured yet.\n\n' +
    'Run:  npx -y github:was-member-keramat/was-gtm-mcp auth\n'
  );
  process.exit(1);
}

// In-memory access token cache
let cachedAccessToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiresAt - 60000) {
    return cachedAccessToken;
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    case crmRes = await fetch(`${DEFAULT_BASE_URL}/crm/v3/objects/contacts?limit=1`, {
      const text = await res.text();
      throw new Error(`Failed to refresh Google OAuth token (HTTP ${res.status}): ${text}`);
    }
  }

  const data = await res.json();
  cachedAccessToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in || 3600) * 1000;
  return cachedAccessToken;
}

// Helper for GTM API calls
async function api(method, path, body) {
  const token = await getAccessToken();
  const url = path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? path : '/' + path}`;

  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(parsed?.output?.message || parsed?.error?.message || cHTTP ${res.status}`);
    err.status = res.status;
    err.body = parsed;
    throw err;
  }

  return parsed;
}

// Result wrapper with 60 KB max limit guard
function asTextResult(data) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const MAX = 60000;
  if (text.length > MAX) {
    return {
      content: [{
        type: 'text',
        text: text.slice(0, MAX) + `\n\n... [truncated ${text.length - MAX} chars; narrow your query]`,
      }],
    };
  }
  return { content: [{ type: 'text', text }] };
}

// Error decoder for Google API errors
function asError(err) {
  return {
    isError: true,
    content: [{
      type: 'text',
      text: 'GTM API error:\n' + JSON.stringify({
        message: err?.message || String(err),
        status: err?.status ?? null,
        code: err?.body?.error?.code ?? null,
        errors: err?.body?.error?.errors ?? null,
        raw: err?.body ?? null,
      }, null, 2),
    }],
  };
}

// 19 GTM Tool Definitions
const tools = [
  {
    name: 'gtm_list_accounts',
    description: 'List all Google Tag Manager accounts accessible to the authenticated user.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'gtm_get_account',
    description: 'Get details of a specific GTM account by Account Path or ID.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Account resource path (e.g. "accounts/123456789")' },
      },
      required: ['path'],
    },
  },
  {
    name: 'gtm_list_containers',
    description: 'List all containers in a GTM parent account.',
    inputSchema: {
      type: 'object',
      properties: {
        parent: { type: 'string', description: 'Parent account resource path (e.g. "accounts/123456789")' },
      },
      required: ['parent'],
    },
  },
  {
    name: 'gtm_get_container',
    description: 'Get details of a specific GTM container.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Container resource path (e.g. "accounts/123/containers/456")' },
      },
      required: ['path'],
    },
  },
  {
    name: 'gtm_create_container',
    description: 'Create a new container in a GTM account.',
    inputSchema: {
      type: 'object',
      properties: {
        parent: { type: 'string', description: 'Parent account path (e.g. "accounts/123456789")' },
        name: { type: 'string', description: 'Container name (e.g. "My Web Store")' },
        usageContext: {
          type: 'array',
          items: { type: 'string' },
          default: ["web"],
          description: 'Usage context array (e.g. ["web"], ["android"], ["ios"], ["server"])',
        },
      },
      required: ['parent', 'name'],
    },
  },
  {
    name: 'gtm_list_workspaces',
    description: 'List all workspaces in a GTM parent container.',
    inputSchema: {
      type: 'object',
      properties: {
        parent: { type: 'string', description: 'Container path (e.g. "accounts/123/containers/456")' },
      },
      required: ['parent'],
    },
  },
  {
    name: 'gtm_get_workspace',
    description: 'Get details of a workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Workspace path (e.g. "accounts/123/containers/456/workspaces/1")' },
      },
      required: ['path'],
    },
  },
  {
    name: 'gtm_create_workspace',
    description: 'Create a new workspace in a GTM container.',
    inputSchema: {
      type: 'object',
      properties: {
        parent: { type: 'string', description: 'Container path (e.g. "accounts/123/containers/456")' },
        name: { type: 'string', description: 'Workspace name' },
        description: { type: 'string', description: 'Workspace description' },
      },
      required: ['parent', 'name'],
    },
  },
  {
    name: 'gtm_list_tags',
    description: 'List all tags in a GTM workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        parent: { type: 'string', description: 'Workspace path (e.g. "accounts/123/containers/456/workspaces/1")' },
      },
      required: ['parent'],
    },
  },
  {
    name: 'gtm_get_tag',
    description: 'Get details of a specific tag.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Tag path (e.g. "accounts/123/containers/456/workspaces/1/tags/10")' },
      },
      required: ['path'],
    },
  },
  {
    name: 'gtm_create_tag',
    description: 'Create a new tag in a GTM workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        parent: { type: 'string', description: 'Workspace path (e.g. "accounts/123/containers/456/workspaces/1")' },
        name: { type: 'string', description: 'Tag name' },
        type: { type: 'string', description: 'Tag type (e.g. "html", "gaawe", "googtag")' },
        parameter: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array of tag parameters/configuration objects',
        },
        firingTriggerId: {
          type: 'array',
          items: { type: 'string' },
          description: 'Trigger IDs that fire this tag',
        },
      },
      required: ['parent', 'name', 'type'],
    },
  },
  {
    name: 'gtm_update_tag',
    description: 'Update an existing tag.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Tag path' },
        tag: { type: 'object', description: 'Complete updated tag object' },
      },
      required: ['path', 'tag'],
    },
  },
  {
    name: 'gtm_delete_tag',
    description: 'Delete a tag from a workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Tag path' },
      },
      required: ['path'],
    },
  },
  {
    name: 'gtm_list_triggers',
    description: 'List triggers in a GTM workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        parent: { type: 'string', description: 'Workspace path' },
      },
      required: ['parent'],
    },
  },
  {
    name: 'gtm_get_trigger',
    description: 'Get details of a specific trigger.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Trigger path' },
      },
      required: ['path'],
    },
  },
  {
    name: 'gtm_create_trigger',
    description: 'Create a new trigger in a workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        parent: { type: 'string', description: 'Workspace path' },
        name: { type: 'string', description: 'Trigger name' },
        type: { type: 'string', description: 'Trigger type (e.g. "pageview", "customEvent", "linkClick")' },
        customEventFilter: {
          type: 'array',
          items: { type: 'object' },
          description: 'Filter rules for custom event triggers',
        },
      },
      required: ['parent', 'name', 'type'],
    },
  },
  {
    name: 'gtm_list_variables',
    description: 'List user-defined variables in a GTM workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        parent: { type: 'string', description: 'Workspace path' },
      },
      required: ['parent'],
    },
  },
  {
    name: 'gtm_create_variable',
    description: 'Create a user-defined variable in a workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        parent: { type: 'string', description: 'Workspace path' },
        name: { type: 'string', description: 'Variable name' },
        type: { type: 'string', description: 'Variable type (e.g. "v" for Data Layer, "c" for Constant, "jsm" for Custom JS)' },
        parameter: {
          type: 'array',
          items: { type: 'object' },
          description: 'Variable parameters',
        },
      },
      required: ['parent', 'name', 'type'],
    },
  },
  {
    name: 'gtm_api',
    description: 'Universal escape-hatch tool to make arbitrary calls to any Google Tag Manager v2 API endpoint.',
    inputSchema: {
      type: 'object',
      properties: {
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
          default: 'GET',
          description: 'HTTP method',
        },
        path: {
          type: 'string',
          description: 'GTM API path or full URL (e.g. "/accounts/123/containers/456/workspaces/1/tags")',
        },
        body: {
          type: 'object',
          description: 'JSON request payload for POST/PUT/PATCH calls',
        },
      },
      required: ['path'],
    },
  },
];

async function handleCall(name, args) {
  switch (name) {
    case 'gtm_list_accounts':
      return asTextResult(await api('GET', '/accounts'));

    case 'gtm_get_account':
      return asTextResult(await api('GET', `/${args.path.replace(/^\/+/, '')}`));

    case 'gtm_list_containers':
      return asTextResult(await api('GET', `/${args.parent.replace(/^\/+/, '')}/containers`));

    case 'gtm_get_container':
      return asTextResult(await api('GET', `/${args.path.replace(/^\/+/, '')}`));

    case 'gtm_create_container':
      return asTextResult(await api('POST', `/${args.parent.replace(/^\/+/, '')}/containers`, {
        name: args.name,
        usageContext: args.usageContext || ['web'],
      }));

    case 'gtm_list_workspaces':
      return asTextResult(await api('GET', `/${args.parent.replace(/^\/+/, '')}/workspaces`));

    case 'gtm_get_workspace':
      return asTextResult(await api('GET', `/${args.path.replace(/^\/+/, '')}`));

    case 'gtm_create_workspace':
      return asTextResult(await api('POST', `/${args.parent.replace(/^\/+/, '')}/workspaces`, {
        name: args.name,
        description: args.description,
      }));

    case 'gtm_list_tags':
      return asTextResult(await api('GET', `/${args.parent.replace(/^\/+/, '')}/tags`));

    case 'gtm_get_tag':
      return asTextResult(await api('GET', `/${args.path.replace(/^\/+/, '')}`));

    case 'gtm_create_tag':
      return asTextResult(await api('POST', `/${args.parent.replace(/^\/+/, '')}/tags`, {
        name: args.name,
        type: args.type,
        parameter: args.parameter,
        firingTriggerId: args.firingTriggerId,
      }));

    case 'gtm_update_tag':
      return asTextResult(await api('PUT', `/${args.path.replace(/^\/+/, '')}`, args.tag));

    case 'gtm_delete_tag':
      return asTextResult(await api('DELETE', `/${args.path.replace(/^\/+/, '')}`));

    case 'gtm_list_triggers':
      return asTextResult(await api('GET', `/${args.parent.replace(/^\/+/, '')}/triggers`));

    case 'gtm_get_trigger':
      return asTextResult(await api('GET', `/${args.path.replace(/^\/+/, '')}`));

    case 'gtm_create_trigger':
      return asTextResult(await api('POST', `/${args.parent.replace(/^\/+/, '')}/triggers`, {
        name: args.name,
        type: args.type,
        customEventFilter: args.customEventFilter,
      }));

    case 'gtm_list_variables':
      return asTextResult(await api('GET', `/${args.parent.replace(/^\/+/, '')}/variables`));

    case 'gtm_create_variable':
      return asTextResult(await api('POST', `/${args.parent.replace(/^\/+/, '')}/variables`, {
        name: args.name,
        type: args.type,
        parameter: args.parameter,
      }));

    case 'gtm_api': {
      const method = (args.method || 'GET').toUpperCase();
      return asTextResult(await api(method, args.path, args.body));
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Start MCP Server
const server = new Server(
  { name: 'was-gtm-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  try {
    return await handleCall(req.params.name, req.params.arguments || {});
  } catch (err) {
    return asError(err);
  }
});

await server.connect(new StdioServerTransport());
console.error('was-gtm-mcp v1.0.0 ready — ${tools.length} tools loaded`);
