import { homedir } from 'node:os';
import { join } from 'node:path';

export const CONFIG_DIR = join(homedir(), '.was-gtm-mcp');
export const CONFIG_FILE = join(CONFIG_DIR, 'config.json');


// Google Tag Manager API defaults
export const DEFAULT_BASE_URL = 'https://tagmanager.googleapis.com/v2';
