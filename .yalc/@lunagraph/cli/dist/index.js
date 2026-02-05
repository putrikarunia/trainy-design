#!/usr/bin/env node
import { Command } from 'commander';
import { scanCommand } from './commands/scan.js';
import { setupCommand } from './commands/setup.js';
import { generateSnapshotsCommand } from './commands/generate-snapshots.js';
const program = new Command();
program
    .name('lunagraph')
    .description('CLI tool for scanning and indexing React components')
    .version('0.1.0');
// Helper to collect multiple --pattern flags into an array
function collect(value, previous) {
    return previous.concat([value]);
}
program
    .command('scan')
    .description('Scan for React components and generate index')
    .option('-p, --pattern <pattern>', 'Glob pattern to scan (can be specified multiple times)', collect, [])
    .option('-o, --output <path>', 'Output path for ComponentIndex.json', '.lunagraph/ComponentIndex.json')
    .action(scanCommand);
program
    .command('setup')
    .description('Get setup help for your project')
    .option('--prompt', 'Output a prompt to paste into Cursor/Claude for AI-assisted setup')
    .action(setupCommand);
program
    .command('generate-snapshots')
    .description('Pre-generate snapshots for all components (for production read-only mode)')
    .option('-c, --component <name>', 'Generate snapshot for a specific component only')
    .action(generateSnapshotsCommand);
program.parse();
