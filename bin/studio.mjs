#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const result = spawnSync(process.execPath, [fileURLToPath(new URL('../node_modules/tsx/dist/cli.mjs', import.meta.url)), fileURLToPath(new URL('../src/cli.ts', import.meta.url)), ...process.argv.slice(2)], {stdio:'inherit'});
process.exit(result.status ?? 1);
