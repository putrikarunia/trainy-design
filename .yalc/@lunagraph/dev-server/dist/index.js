#!/usr/bin/env node
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { watch } from 'chokidar';
import { readFile, writeFile, access, mkdir, readdir } from 'fs/promises';
import { resolve, relative, join, basename, dirname } from 'path';
import { constants } from 'fs';
import chalk from 'chalk';
import { generateJSX, generateCompleteFile, updateExistingFile, extractComponentDependencies, getComponentImportMappings, extractComponentReturn, generateSnapshot } from '@lunagraph/codegen';
import { mergeWithClaude, isClaudeAvailable } from './claudeMerge.js';
import { extractTypesFromFile } from './extractTypes.js';
import { handleChat, handleChatStream } from './aiChat.js';
const PORT = process.env.LUNAGRAPH_PORT || 4001;
const PROJECT_ROOT = process.cwd();
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
// Load ComponentIndex.json
let componentIndex = {};
let useClaudeMerge = false;
async function loadComponentIndex() {
    try {
        const indexPath = join(PROJECT_ROOT, '.lunagraph', 'ComponentIndex.json');
        const content = await readFile(indexPath, 'utf-8');
        componentIndex = JSON.parse(content);
        console.log(chalk.green('✓ Loaded ComponentIndex.json'));
    }
    catch (error) {
        console.warn(chalk.yellow('⚠ ComponentIndex.json not found. Run `lunagraph scan` first.'));
    }
}
async function checkClaudeAvailability() {
    useClaudeMerge = await isClaudeAvailable();
    if (useClaudeMerge) {
        console.log(chalk.green('✓ Claude CLI detected - using intelligent merge'));
    }
    else {
        console.log(chalk.yellow('⚠ Claude CLI not found - using deterministic merge'));
    }
}
/**
 * Extract all className values from elements recursively
 */
function extractClassesFromElements(elements, classes) {
    function extractClasses(el) {
        // Get className from props
        if ('props' in el && el.props?.className) {
            const classNames = String(el.props.className).split(/\s+/).filter(Boolean);
            classNames.forEach(c => classes.add(c));
        }
        // Get className from styles (some elements might store it there)
        if ('styles' in el && el.styles?.className) {
            const classNames = String(el.styles.className).split(/\s+/).filter(Boolean);
            classNames.forEach(c => classes.add(c));
        }
        // Recurse into children
        if ('children' in el && Array.isArray(el.children)) {
            el.children.forEach(child => extractClasses(child));
        }
    }
    elements.forEach(extractClasses);
}
/**
 * Generate a pages manifest (pages.json) containing all canvas pages
 * This is used for read-only mode to avoid manual imports of each canvas
 */
async function generatePagesManifest() {
    const canvasesDir = join(PROJECT_ROOT, '.lunagraph', 'canvases');
    const pages = [];
    try {
        const entries = await readdir(canvasesDir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                try {
                    const canvasFile = join(canvasesDir, entry.name, 'canvas.json');
                    const content = await readFile(canvasFile, 'utf-8');
                    const canvasData = JSON.parse(content);
                    pages.push({
                        id: canvasData.id || entry.name,
                        name: canvasData.name || entry.name,
                        elements: canvasData.elements || []
                    });
                }
                catch {
                    // Skip canvases that can't be read
                }
            }
        }
    }
    catch {
        // Canvases directory doesn't exist yet
        return;
    }
    // Sort pages by name for consistent ordering
    pages.sort((a, b) => a.name.localeCompare(b.name));
    // Write pages.json manifest
    const manifestPath = join(PROJECT_ROOT, '.lunagraph', 'pages.json');
    const manifestContent = {
        generatedAt: new Date().toISOString(),
        pages
    };
    await writeFile(manifestPath, JSON.stringify(manifestContent, null, 2), 'utf-8');
    console.log(chalk.blue('  → Updated pages manifest:'), `${pages.length} pages`);
}
/**
 * Scan all canvases and update safelist.html with all Tailwind classes
 * This ensures Tailwind compiles all classes used across all canvases
 */
async function updateTailwindSafelist() {
    const classes = new Set();
    const canvasesDir = join(PROJECT_ROOT, '.lunagraph', 'canvases');
    try {
        const entries = await readdir(canvasesDir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                try {
                    const canvasFile = join(canvasesDir, entry.name, 'canvas.json');
                    const content = await readFile(canvasFile, 'utf-8');
                    const canvasData = JSON.parse(content);
                    if (canvasData.elements && Array.isArray(canvasData.elements)) {
                        extractClassesFromElements(canvasData.elements, classes);
                    }
                }
                catch {
                    // Skip canvases that can't be read
                }
            }
        }
    }
    catch {
        // Canvases directory doesn't exist yet
    }
    // Write safelist.html with all classes in a format Tailwind definitely understands
    const safelistPath = join(PROJECT_ROOT, '.lunagraph', 'safelist.html');
    const safelistContent = `<!--
  Auto-generated safelist for Tailwind CSS
  Classes used in Lunagraph canvases are listed here to ensure Tailwind compiles them.
  DO NOT EDIT - This file is regenerated on every canvas save.
-->
<div class="${Array.from(classes).sort().join(' ')}"></div>
`;
    await writeFile(safelistPath, safelistContent, 'utf-8');
}
// Enable CORS for all origins in development
app.use(cors());
app.use(express.json({ limit: '50mb' }));
// Serve static assets from public/.lunagraph-assets (also served by Next.js in prod)
app.use('/.lunagraph-assets', express.static(join(PROJECT_ROOT, 'public', '.lunagraph-assets')));
// Upload asset (image) endpoint
app.post('/api/asset/upload', async (req, res) => {
    try {
        const { data, filename, mimeType } = req.body;
        if (!data) {
            return res.status(400).json({
                success: false,
                error: 'Missing data field'
            });
        }
        // Extract base64 data (remove data URL prefix if present)
        let base64Data = data;
        if (data.includes(',')) {
            base64Data = data.split(',')[1];
        }
        // Generate unique filename
        const ext = mimeType?.split('/')[1] || 'png';
        const uniqueFilename = filename || `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
        // Create assets directory if it doesn't exist
        // Using public/.lunagraph-assets so Next.js serves them in production
        const assetsDir = join(PROJECT_ROOT, 'public', '.lunagraph-assets');
        await mkdir(assetsDir, { recursive: true });
        // Write file
        const filePath = join(assetsDir, uniqueFilename);
        await writeFile(filePath, Buffer.from(base64Data, 'base64'));
        // Return the URL path to access the file (served by Next.js from public/)
        const assetUrl = `/.lunagraph-assets/${uniqueFilename}`;
        console.log(chalk.green('✓ Uploaded asset:'), uniqueFilename);
        res.json({
            success: true,
            url: assetUrl,
            filename: uniqueFilename
        });
    }
    catch (error) {
        console.error(chalk.red('Error uploading asset:'), error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// Store connected clients
const clients = new Set();
// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log(chalk.green('✓ Client connected'));
    clients.add(ws);
    ws.on('close', () => {
        console.log(chalk.yellow('- Client disconnected'));
        clients.delete(ws);
    });
    ws.on('error', (error) => {
        console.error(chalk.red('WebSocket error:'), error);
        clients.delete(ws);
    });
});
// Broadcast message to all connected clients
function broadcast(message) {
    const data = JSON.stringify(message);
    clients.forEach((client) => {
        if (client.readyState === 1) { // OPEN
            client.send(data);
        }
    });
}
// Validate file path is within project root (security)
function validatePath(filePath) {
    try {
        const absolutePath = resolve(PROJECT_ROOT, filePath);
        const relativePath = relative(PROJECT_ROOT, absolutePath);
        // Prevent directory traversal attacks
        if (relativePath.startsWith('..') || relativePath.startsWith('/')) {
            return { valid: false, error: 'Path outside project root' };
        }
        return { valid: true, absolutePath };
    }
    catch (error) {
        return { valid: false, error: 'Invalid path' };
    }
}
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', clients: clients.size });
});
// AI Chat endpoint (streaming with SSE)
app.post('/api/ai/chat', async (req, res) => {
    try {
        // AI provider: 'cli' uses Claude CLI (free), 'api' uses Anthropic API (costs money)
        // Default to 'cli' if no API key is set
        const aiProvider = process.env.LUNAGRAPH_AI_PROVIDER || (process.env.ANTHROPIC_API_KEY ? 'api' : 'cli');
        // For API mode, require API key
        if (aiProvider === 'api' && !process.env.ANTHROPIC_API_KEY) {
            return res.status(400).json({
                success: false,
                error: 'ANTHROPIC_API_KEY not set. Set it or use LUNAGRAPH_AI_PROVIDER=cli for Claude CLI.'
            });
        }
        const { messages, context, stream } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({
                success: false,
                error: 'Missing or invalid messages array'
            });
        }
        console.log(chalk.blue('AI Chat:'), messages[messages.length - 1]?.content?.slice(0, 50) + '...');
        const chatContext = context || {
            canvasElements: [],
            availableComponents: Object.keys(componentIndex)
        };
        // Use streaming if requested
        if (stream) {
            console.log(chalk.cyan('  → Streaming response'));
            await handleChatStream(messages, chatContext, res);
            return;
        }
        // Fallback to non-streaming
        const result = await handleChat(messages, chatContext);
        console.log(chalk.green('✓ AI response:'), result.toolResults.length, 'tool calls');
        res.json({
            success: true,
            response: result.response,
            toolResults: result.toolResults
        });
    }
    catch (error) {
        console.error(chalk.red('AI Chat error:'), error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// Proxy endpoint for iframes - strips X-Frame-Options and CSP headers
// This allows embedding sites that normally block iframes
// ⚠️ Only use in development - bypasses security headers
// Handle CORS preflight for proxy
app.options('/proxy', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.status(204).end();
});
app.get('/proxy', async (req, res) => {
    try {
        const targetUrl = req.query.url;
        if (!targetUrl) {
            return res.status(400).json({
                success: false,
                error: 'Missing url parameter'
            });
        }
        // Validate URL
        let parsedUrl;
        try {
            parsedUrl = new URL(targetUrl);
            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                throw new Error('Invalid protocol');
            }
        }
        catch {
            return res.status(400).json({
                success: false,
                error: 'Invalid URL'
            });
        }
        console.log(chalk.blue('Proxying:'), targetUrl);
        // Fetch the target URL
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            redirect: 'follow',
        });
        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                error: `Failed to fetch: ${response.statusText}`
            });
        }
        // Get content type
        const contentType = response.headers.get('content-type') || 'text/html';
        // For HTML content, we need to rewrite relative URLs and intercept navigation
        if (contentType.includes('text/html')) {
            let html = await response.text();
            // Add base tag to handle relative URLs
            const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
            const baseTag = `<base href="${baseUrl}/">`;
            // Proxy URL for navigation interception
            const proxyBase = `http://localhost:${PORT}/proxy?url=`;
            // Script to intercept all navigation, fetch, and history API calls
            const navigationScript = `
<script>
(function() {
  const PROXY_BASE = '${proxyBase}';
  const ORIGIN_BASE = '${baseUrl}';
  
  // Helper to convert relative URL to absolute
  function toAbsoluteUrl(url) {
    if (!url) return url;
    if (typeof url !== 'string') url = String(url);
    if (url.startsWith('javascript:') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('#') || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }
    try {
      return new URL(url, ORIGIN_BASE).href;
    } catch {
      return url;
    }
  }
  
  // Check if URL should be proxied
  function shouldProxy(url) {
    if (!url || typeof url !== 'string') return false;
    if (url.startsWith('javascript:') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('#') || url.startsWith('data:') || url.startsWith('blob:')) {
      return false;
    }
    // Don't double-proxy
    if (url.includes('/proxy?url=')) return false;
    return true;
  }
  
  // Helper to proxy a URL
  function proxyUrl(url) {
    if (!shouldProxy(url)) return url;
    const absolute = toAbsoluteUrl(url);
    if (!shouldProxy(absolute)) return absolute;
    return PROXY_BASE + encodeURIComponent(absolute);
  }
  
  // Intercept link clicks
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a[href]');
    if (link) {
      const href = link.getAttribute('href');
      if (shouldProxy(href)) {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = proxyUrl(href);
      }
    }
  }, true);
  
  // Intercept form submissions
  document.addEventListener('submit', function(e) {
    const form = e.target;
    if (form.tagName === 'FORM') {
      const action = form.getAttribute('action') || window.location.href;
      if (shouldProxy(action)) {
        e.preventDefault();
        const formData = new FormData(form);
        const method = (form.method || 'GET').toUpperCase();
        
        if (method === 'GET') {
          const params = new URLSearchParams(formData);
          const url = new URL(toAbsoluteUrl(action));
          url.search = params.toString();
          window.location.href = proxyUrl(url.href);
        } else {
          form.action = proxyUrl(action);
          form.submit();
        }
      }
    }
  }, true);
  
  // Intercept History API to prevent origin mismatch errors
  const origPushState = history.pushState;
  const origReplaceState = history.replaceState;
  
  history.pushState = function(state, title, url) {
    try {
      // Keep URL relative or use current URL to avoid origin errors
      if (url && shouldProxy(url)) {
        // Just use the path portion to avoid cross-origin issues
        const parsed = new URL(toAbsoluteUrl(url));
        url = parsed.pathname + parsed.search + parsed.hash;
      }
      return origPushState.call(this, state, title, url);
    } catch(e) {
      console.warn('[Lunagraph Proxy] pushState blocked:', e.message);
      return origPushState.call(this, state, title, null);
    }
  };
  
  history.replaceState = function(state, title, url) {
    try {
      if (url && shouldProxy(url)) {
        const parsed = new URL(toAbsoluteUrl(url));
        url = parsed.pathname + parsed.search + parsed.hash;
      }
      return origReplaceState.call(this, state, title, url);
    } catch(e) {
      console.warn('[Lunagraph Proxy] replaceState blocked:', e.message);
      return origReplaceState.call(this, state, title, null);
    }
  };
  
  // Intercept fetch to proxy cross-origin requests
  const origFetch = window.fetch;
  window.fetch = function(input, init) {
    let url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input));
    
    if (shouldProxy(url)) {
      const proxiedUrl = proxyUrl(url);
      if (typeof input === 'string') {
        input = proxiedUrl;
      } else if (input instanceof Request) {
        input = new Request(proxiedUrl, input);
      }
    }
    
    return origFetch.call(this, input, init);
  };
  
  // Intercept XMLHttpRequest
  const origXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    if (shouldProxy(url)) {
      url = proxyUrl(url);
    }
    return origXHROpen.call(this, method, url, ...args);
  };
  
  console.log('[Lunagraph Proxy] Full interception active (navigation, history, fetch, XHR)');
})();
</script>`;
            // Insert base tag and script after <head> if it exists
            if (html.includes('<head>')) {
                html = html.replace('<head>', `<head>${baseTag}${navigationScript}`);
            }
            else if (html.includes('<HEAD>')) {
                html = html.replace('<HEAD>', `<HEAD>${baseTag}${navigationScript}`);
            }
            else {
                // No head tag, prepend
                html = baseTag + navigationScript + html;
            }
            // Set response headers - explicitly allow framing and CORS
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('X-Frame-Options', 'ALLOWALL');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', '*');
            res.removeHeader('Content-Security-Policy');
            res.send(html);
        }
        else {
            // For other content types (JS, CSS, images, etc.), pipe through with CORS
            const buffer = await response.arrayBuffer();
            res.setHeader('Content-Type', contentType);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', '*');
            res.send(Buffer.from(buffer));
        }
    }
    catch (error) {
        console.error(chalk.red('Proxy error:'), error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// Read file and extract component return JSX + variables
app.get('/api/files/*', async (req, res) => {
    try {
        const filePath = req.params[0];
        const validation = validatePath(filePath);
        if (!validation.valid) {
            return res.status(403).json({
                success: false,
                error: validation.error
            });
        }
        console.log(chalk.blue('Reading file:'), filePath);
        const content = await readFile(validation.absolutePath, 'utf-8');
        // Extract return JSX and variables
        // Pass target component name from file path to prioritize the main component
        const targetComponentName = basename(filePath, '.tsx').replace(/\.tsx?$/, '');
        const extracted = extractComponentReturn(content, { targetComponentName });
        if (!extracted) {
            return res.status(400).json({
                success: false,
                error: 'Could not extract component return statement'
            });
        }
        res.json({
            success: true,
            filePath,
            variables: extracted.variables,
            initialValues: extracted.initialValues,
            props: extracted.props,
            raw: content
        });
    }
    catch (error) {
        console.error(chalk.red('Error reading file:'), error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// Write FEElement tree to file
app.post('/api/files/*', async (req, res) => {
    try {
        const filePath = req.params[0];
        const validation = validatePath(filePath);
        if (!validation.valid) {
            return res.status(403).json({
                success: false,
                error: validation.error
            });
        }
        const { elements, stateContext, internalComponent } = req.body;
        if (!elements || !Array.isArray(elements)) {
            return res.status(400).json({
                success: false,
                error: 'Missing or invalid elements array'
            });
        }
        console.log(chalk.blue('Writing file:'), filePath);
        if (internalComponent) {
            console.log(chalk.blue('  → Internal component:'), internalComponent.name, `(lines ${internalComponent.startLine}-${internalComponent.endLine})`);
        }
        // Check if file exists
        let fileExists = false;
        try {
            await access(validation.absolutePath, constants.F_OK);
            fileExists = true;
        }
        catch {
            fileExists = false;
        }
        let generatedCode;
        if (fileExists) {
            // Update existing file - preserve imports, exports, hooks, etc.
            console.log(chalk.blue('  → Updating existing file'));
            const existingCode = await readFile(validation.absolutePath, 'utf-8');
            // For internal component updates, we need to:
            // 1. Generate the new JSX for the internal component
            // 2. Replace only that component's body in the file
            if (internalComponent) {
                console.log(chalk.blue('  → Updating internal component only:'), internalComponent.name);
                if (useClaudeMerge) {
                    // Use Claude to update just the internal component
                    const generatedJSX = generateJSX(elements);
                    const componentDeps = extractComponentDependencies(elements);
                    const componentImports = getComponentImportMappings(componentDeps, componentIndex);
                    try {
                        generatedCode = await mergeWithClaude({
                            originalCode: existingCode,
                            generatedJSX,
                            filePath,
                            componentImports,
                            stateContext,
                            internalComponentName: internalComponent.name,
                            internalComponentRange: {
                                startLine: internalComponent.startLine,
                                endLine: internalComponent.endLine,
                            }
                        });
                    }
                    catch (claudeError) {
                        console.warn(chalk.yellow('  ⚠ Claude merge failed for internal component:'), claudeError);
                        // Fallback: just return the existing code (don't break the file)
                        return res.status(500).json({
                            success: false,
                            error: `Failed to update internal component ${internalComponent.name}: ${claudeError}`
                        });
                    }
                }
                else {
                    // Without Claude, we can't safely do partial updates
                    // We would need AST-based partial replacement which is complex
                    return res.status(400).json({
                        success: false,
                        error: 'Internal component updates require Claude CLI. Install Claude CLI to enable this feature.'
                    });
                }
            }
            else {
                // Normal full-file update
                if (useClaudeMerge) {
                    // Use Claude CLI for intelligent merging
                    const generatedJSX = generateJSX(elements);
                    // Get component import hints for Claude
                    const componentDeps = extractComponentDependencies(elements);
                    const componentImports = getComponentImportMappings(componentDeps, componentIndex);
                    try {
                        generatedCode = await mergeWithClaude({
                            originalCode: existingCode,
                            generatedJSX,
                            filePath,
                            componentImports,
                            stateContext // Pass state context to Claude
                        });
                    }
                    catch (claudeError) {
                        // Fall back to deterministic mode if Claude merge fails
                        console.warn(chalk.yellow('  ⚠ Claude merge failed, falling back to deterministic mode:'), claudeError);
                        generatedCode = updateExistingFile({
                            existingCode,
                            elements,
                            componentIndex,
                            targetFilePath: filePath
                        });
                    }
                }
                else {
                    // Fallback to deterministic AST manipulation
                    generatedCode = updateExistingFile({
                        existingCode,
                        elements,
                        componentIndex,
                        targetFilePath: filePath
                    });
                }
            }
        }
        else {
            // Generate new file - create complete component
            console.log(chalk.blue('  → Creating new file'));
            // Extract component name from filename (e.g., MyComponent.tsx → MyComponent)
            const componentName = basename(filePath, '.tsx').replace(/\.tsx?$/, '');
            generatedCode = generateCompleteFile({
                componentName,
                elements,
                componentIndex,
                targetFilePath: filePath
            });
        }
        // Write to file
        await writeFile(validation.absolutePath, generatedCode, 'utf-8');
        // Determine which snapshots need updating
        const snapshotDir = join(PROJECT_ROOT, '.lunagraph', 'snapshots');
        let snapshotUpdated = false;
        const snapshotsToUpdate = [];
        if (internalComponent) {
            // For internal component updates, update both:
            // 1. The internal component's own snapshot
            // 2. All parent component snapshots that might use it
            snapshotsToUpdate.push(internalComponent.name);
            // Also find the main component(s) in the file and update their snapshots
            // They might render the internal component
            const extracted = extractComponentReturn(generatedCode);
            if (extracted?.componentName) {
                snapshotsToUpdate.push(extracted.componentName);
            }
        }
        else {
            // Normal update: just the main component
            const componentName = basename(filePath, '.tsx').replace(/\.tsx?$/, '');
            snapshotsToUpdate.push(componentName);
        }
        // Update all relevant snapshots
        for (const componentName of snapshotsToUpdate) {
            const snapshotPath = join(snapshotDir, `${componentName}.snapshot.tsx`);
            try {
                // Check if snapshot exists
                await access(snapshotPath, constants.F_OK);
                // Regenerate snapshot from updated source
                console.log(chalk.blue('  → Regenerating snapshot for:'), componentName);
                const extracted = extractComponentReturn(generatedCode, { targetComponentName: componentName });
                if (extracted) {
                    const extractedTypes = extractTypesFromFile(validation.absolutePath, PROJECT_ROOT);
                    const { code: snapshotCode } = generateSnapshot(extracted, extractedTypes, {
                        sourcePath: filePath,
                        snapshotDir: '.lunagraph/snapshots',
                    });
                    await writeFile(snapshotPath, snapshotCode, 'utf-8');
                    console.log(chalk.green('  ✓ Snapshot updated:'), componentName);
                    snapshotUpdated = true;
                }
            }
            catch {
                // No snapshot exists for this component, that's fine
            }
        }
        // Update snapshots index if any snapshot was updated
        if (snapshotUpdated) {
            await updateSnapshotsIndex(snapshotDir);
        }
        // Broadcast file change to all clients
        broadcast({
            type: 'file-updated',
            filePath,
            elements,
            snapshotUpdated,
            internalComponent: internalComponent?.name
        });
        res.json({
            success: true,
            filePath,
            code: generatedCode,
            snapshotUpdated,
            internalComponentUpdated: internalComponent?.name
        });
    }
    catch (error) {
        console.error(chalk.red('Error writing file:'), error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// Snapshot Generation Endpoint
// Create snapshot file from source component
app.post('/api/snapshot/create', async (req, res) => {
    try {
        const { componentPath, componentName: requestedComponentName } = req.body;
        if (!componentPath) {
            return res.status(400).json({
                success: false,
                error: 'Missing componentPath'
            });
        }
        const validation = validatePath(componentPath);
        if (!validation.valid) {
            return res.status(403).json({
                success: false,
                error: validation.error
            });
        }
        console.log(chalk.blue('Creating snapshot for:'), requestedComponentName || componentPath);
        // Read source file
        const sourceCode = await readFile(validation.absolutePath, 'utf-8');
        // Extract component data (AST-based for JSX extraction)
        // Use the requested component name if provided, otherwise fall back to file name
        const targetComponentName = requestedComponentName || basename(componentPath, '.tsx').replace(/\.tsx?$/, '');
        const extracted = extractComponentReturn(sourceCode, { targetComponentName });
        if (!extracted) {
            return res.status(400).json({
                success: false,
                error: 'Could not extract component data'
            });
        }
        // Extract proper TypeScript types using ts-morph
        const extractedTypes = extractTypesFromFile(validation.absolutePath, PROJECT_ROOT);
        console.log(chalk.blue('  → Extracted types:'), extractedTypes ? {
            props: extractedTypes.props.length,
            stateVars: extractedTypes.stateVariables.length,
            constants: extractedTypes.internalConstants.length
        } : 'none');
        // Generate snapshot with proper types
        const { code: snapshotCode, snapshotProps } = generateSnapshot(extracted, extractedTypes, {
            sourcePath: componentPath,
            snapshotDir: '.lunagraph/snapshots',
        });
        // Determine snapshot file path
        // components/ProductList.tsx → .lunagraph/snapshots/ProductList.snapshot.tsx
        const componentName = extracted.componentName || basename(componentPath, '.tsx');
        const snapshotDir = join(PROJECT_ROOT, '.lunagraph', 'snapshots');
        const snapshotFileName = `${componentName}.snapshot.tsx`;
        const snapshotPath = join(snapshotDir, snapshotFileName);
        const relativeSnapshotPath = `.lunagraph/snapshots/${snapshotFileName}`;
        // Create snapshots directory
        await mkdir(snapshotDir, { recursive: true });
        // Write snapshot file
        await writeFile(snapshotPath, snapshotCode, 'utf-8');
        console.log(chalk.green('✓ Created snapshot:'), relativeSnapshotPath);
        // Update snapshots index file (so demo app can import all snapshots)
        await updateSnapshotsIndex(snapshotDir);
        // Generate initial mock values from snapshot props
        // Skip props with import-based defaults - they use the default value in the snapshot code
        const initialMockValues = {};
        for (const prop of snapshotProps) {
            if (!prop.hasImportDefault) {
                initialMockValues[prop.name] = generateDefaultMockValue(prop);
            }
        }
        res.json({
            success: true,
            componentPath,
            snapshotPath: relativeSnapshotPath,
            snapshotComponentName: `${componentName}Snapshot`,
            componentName: extracted.componentName,
            snapshotProps,
            initialMockValues,
            internalComponents: extracted.internalComponents,
        });
    }
    catch (error) {
        console.error(chalk.red('Error creating snapshot:'), error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// Update .lunagraph/snapshots/index.ts with all snapshot exports
async function updateSnapshotsIndex(snapshotDir) {
    try {
        // Read all .snapshot.tsx files in the directory
        const files = await readdir(snapshotDir);
        const snapshotFiles = files.filter(f => f.endsWith('.snapshot.tsx'));
        if (snapshotFiles.length === 0) {
            return;
        }
        // Check which snapshots have internal components by reading the file
        const snapshotsWithInternals = [];
        for (const file of snapshotFiles) {
            const filePath = join(snapshotDir, file);
            const content = await readFile(filePath, 'utf-8');
            if (content.includes('__internalComponents')) {
                snapshotsWithInternals.push(file);
            }
        }
        // Generate imports and exports
        const imports = [];
        const exports = [];
        for (const file of snapshotFiles) {
            // Button.snapshot.tsx → ButtonSnapshot
            const baseName = file.replace('.snapshot.tsx', '');
            const snapshotName = `${baseName}Snapshot`;
            const modulePath = `./${file.replace('.tsx', '')}`;
            // Check if this snapshot has internal components
            const hasInternals = snapshotsWithInternals.includes(file);
            if (hasInternals) {
                const internalName = `__internal_${baseName}`;
                imports.push(`import ${snapshotName}, { __internalComponents as ${internalName} } from '${modulePath}'`);
            }
            else {
                imports.push(`import ${snapshotName} from '${modulePath}'`);
            }
            exports.push(snapshotName);
        }
        // Generate internal components merge
        const internalMerge = snapshotsWithInternals
            .map(file => `__internal_${file.replace('.snapshot.tsx', '')}`)
            .map(name => `  ...${name}`)
            .join(',\n');
        const indexContent = `// Auto-generated by @lunagraph/dev-server - do not edit manually
// This file is updated when snapshots are created or modified

import type { ComponentType } from 'react'
${imports.join('\n')}

// Version timestamp - changes on each update to trigger hot reload
export const snapshotsVersion = ${Date.now()}

// Export all snapshots
export { ${exports.join(', ')} }

// Export as snapshots object (for passing to LunagraphEditor)
export const snapshots: Record<string, ComponentType<any>> = {
  ${exports.join(',\n  ')}
}

// Export all internal components merged together (for use in canvas)
export const internalComponents: Record<string, ComponentType<any>> = {
${internalMerge || '  // No internal components'}
}
`;
        const indexPath = join(snapshotDir, 'index.ts');
        await writeFile(indexPath, indexContent, 'utf-8');
        console.log(chalk.green('✓ Updated snapshots index'));
    }
    catch (error) {
        console.error(chalk.yellow('⚠ Failed to update snapshots index:'), error);
    }
}
// Generate sensible default mock values based on prop name and type
function generateDefaultMockValue(prop) {
    const { name, initialValue, source, options, type } = prop;
    // Use initial value if available
    if (initialValue !== undefined) {
        return initialValue;
    }
    // If prop has options (union type), use the first option as default
    // This handles things like variant="default", size="default"
    if (options && options.length > 0) {
        return options[0];
    }
    // Use TypeScript type info to determine default value
    // This handles props from library component types (e.g., ComponentProps<typeof SomeComponent>)
    if (type) {
        // Number types: "number", "number | null", "number | undefined", etc.
        if (/\bnumber\b/.test(type) && !/\bstring\b/.test(type)) {
            return 0;
        }
        // Boolean types
        if (type === 'boolean' || /^boolean\s*\|/.test(type) || /\|\s*boolean$/.test(type)) {
            return false;
        }
        // String types (but not union with other non-null types)
        if (type === 'string' || type === 'string | undefined' || type === 'string | null' || type === 'string | null | undefined') {
            return '';
        }
    }
    // Common naming patterns
    if (name === 'children')
        return null;
    if (name === 'className')
        return '';
    if (name === 'style')
        return {};
    if (name === 'id')
        return '';
    // Boolean patterns
    if (name.startsWith('is') || name.startsWith('has') || name.startsWith('show') || name.startsWith('can')) {
        return false;
    }
    if (name === 'loading' || name === 'disabled' || name === 'checked' || name === 'open') {
        return false;
    }
    // Array patterns
    if (name.endsWith('s') || name === 'data' || name === 'items' || name === 'list') {
        return [];
    }
    // Object patterns
    if (name === 'user' || name === 'config' || name === 'options' || name === 'settings') {
        return {};
    }
    // Data object patterns (formData, userData, configData, etc.)
    if (name.endsWith('Data') || name === 'form' || name === 'values' || name === 'state' || name === 'props') {
        return {};
    }
    // Error patterns
    if (name === 'error') {
        return null;
    }
    // String patterns - capitalize first letter
    if (name === 'title' || name === 'label' || name === 'text' || name === 'name' || name === 'description') {
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
    // Number patterns
    if (name === 'count' || name === 'total' || name === 'index' || name === 'page' || name === 'size') {
        return 0;
    }
    // Based on source
    if (source === 'useContext')
        return undefined;
    if (source === 'customHook')
        return undefined;
    // Default
    return undefined;
}
// Canvas Management Endpoints
// Configuration
const MAX_CANVAS_VERSIONS = 20; // Keep last N versions
// Helper to generate canvas slug from name
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
// Helper to create a backup version before saving
async function createCanvasVersion(canvasDir, canvasFile) {
    try {
        // Check if current canvas file exists
        await access(canvasFile, constants.F_OK);
        // Read current content
        const currentContent = await readFile(canvasFile, 'utf-8');
        const currentData = JSON.parse(currentContent);
        // Skip versioning if canvas is empty (no elements)
        if (!currentData.elements || currentData.elements.length === 0) {
            return null;
        }
        // Create versions directory
        const versionsDir = join(canvasDir, 'versions');
        await mkdir(versionsDir, { recursive: true });
        // Generate version filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const versionFile = join(versionsDir, `canvas-${timestamp}.json`);
        // Write version file
        await writeFile(versionFile, currentContent, 'utf-8');
        console.log(chalk.blue('  → Created version:'), `canvas-${timestamp}.json`);
        // Cleanup old versions (keep only last N)
        await pruneCanvasVersions(versionsDir);
        return versionFile;
    }
    catch (error) {
        // If file doesn't exist or is invalid, skip versioning
        if (error.code !== 'ENOENT') {
            console.warn(chalk.yellow('⚠ Failed to create canvas version:'), error);
        }
        return null;
    }
}
// Helper to prune old versions, keeping only the most recent N
async function pruneCanvasVersions(versionsDir) {
    try {
        const files = await readdir(versionsDir);
        const versionFiles = files
            .filter(f => f.startsWith('canvas-') && f.endsWith('.json'))
            .sort()
            .reverse(); // Newest first (ISO timestamps sort alphabetically)
        // Delete old versions beyond the limit
        if (versionFiles.length > MAX_CANVAS_VERSIONS) {
            const toDelete = versionFiles.slice(MAX_CANVAS_VERSIONS);
            for (const file of toDelete) {
                const filePath = join(versionsDir, file);
                const { unlink } = await import('fs/promises');
                await unlink(filePath);
                console.log(chalk.gray('  → Pruned old version:'), file);
            }
        }
    }
    catch (error) {
        console.warn(chalk.yellow('⚠ Failed to prune canvas versions:'), error);
    }
}
// Helper to process elements and upload base64 images
async function processElementImages(element) {
    // Check if this is an HTML element with image tag and base64 src
    if (element.type === 'html' &&
        element.tag === 'img' &&
        element.props?.src &&
        typeof element.props.src === 'string' &&
        element.props.src.startsWith('data:image/')) {
        try {
            // Extract base64 data
            const base64Data = element.props.src.split(',')[1];
            const mimeType = element.props.src.match(/data:(image\/[^;]+);/)?.[1];
            // Generate unique filename
            const ext = mimeType?.split('/')[1] || 'png';
            const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
            // Create assets directory if it doesn't exist
            // Using public/.lunagraph-assets so Next.js serves them in production
            const assetsDir = join(PROJECT_ROOT, 'public', '.lunagraph-assets');
            await mkdir(assetsDir, { recursive: true });
            // Write file
            const filePath = join(assetsDir, uniqueFilename);
            await writeFile(filePath, Buffer.from(base64Data, 'base64'));
            // Update element with new URL (served by Next.js from public/)
            const assetUrl = `/.lunagraph-assets/${uniqueFilename}`;
            console.log(chalk.green('✓ Converted base64 image to asset:'), uniqueFilename);
            // Return updated element
            return {
                ...element,
                props: {
                    ...element.props,
                    src: assetUrl
                }
            };
        }
        catch (error) {
            console.error(chalk.red('Failed to convert base64 image:'), error);
            // Keep original base64 if conversion fails
        }
    }
    // Recursively process children for HTML elements
    if (element.type === 'html' && element.children && Array.isArray(element.children)) {
        return {
            ...element,
            children: await Promise.all(element.children.map((child) => processElementImages(child)))
        };
    }
    // Recursively process children for component elements
    if (element.type === 'component' && element.children && Array.isArray(element.children)) {
        return {
            ...element,
            children: await Promise.all(element.children.map((child) => processElementImages(child)))
        };
    }
    return element;
}
// Save canvas
app.post('/api/canvas/save', async (req, res) => {
    try {
        const { id, name, elements, zoom, pan, metadata, forceEmpty } = req.body;
        const canvasId = id || slugify(name);
        const canvasDir = join(PROJECT_ROOT, '.lunagraph', 'canvases', canvasId);
        const canvasFile = join(canvasDir, 'canvas.json');
        // Safety check: prevent saving empty canvas unless explicitly allowed
        // This protects against bugs that might accidentally clear the canvas
        if ((!elements || elements.length === 0) && !forceEmpty) {
            // Check if there's an existing canvas with content
            try {
                const existing = await readFile(canvasFile, 'utf-8');
                const existingData = JSON.parse(existing);
                if (existingData.elements && existingData.elements.length > 0) {
                    console.warn(chalk.yellow('⚠ Blocked save of empty canvas (existing has content). Use forceEmpty to override.'));
                    return res.status(400).json({
                        success: false,
                        error: 'Refusing to save empty canvas over existing content. Pass forceEmpty: true to override.',
                        blocked: true
                    });
                }
            }
            catch {
                // No existing canvas, allow saving empty
            }
        }
        // Create directories if they don't exist
        await mkdir(canvasDir, { recursive: true });
        // Create a version backup before saving (only if canvas already exists with content)
        await createCanvasVersion(canvasDir, canvasFile);
        // Process elements to convert any base64 images to uploaded assets
        const processedElements = await Promise.all(elements.map(element => processElementImages(element)));
        // Check if canvas exists to determine createdAt
        let createdAt = new Date().toISOString();
        try {
            const existing = await readFile(canvasFile, 'utf-8');
            const existingData = JSON.parse(existing);
            createdAt = existingData.createdAt || createdAt;
        }
        catch {
            // New canvas, use current timestamp
        }
        const canvasData = {
            id: canvasId,
            name,
            elements: processedElements,
            createdAt,
            updatedAt: new Date().toISOString(),
            zoom,
            pan,
            metadata
        };
        await writeFile(canvasFile, JSON.stringify(canvasData, null, 2), 'utf-8');
        // Update Tailwind safelist with all classes from all canvases
        await updateTailwindSafelist();
        // Update pages manifest for read-only mode
        await generatePagesManifest();
        console.log(chalk.green('✓ Saved canvas:'), canvasId);
        res.json({
            success: true,
            canvas: canvasData
        });
    }
    catch (error) {
        console.error(chalk.red('Error saving canvas:'), error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// Load canvas
app.get('/api/canvas/:canvasId', async (req, res) => {
    try {
        const { canvasId } = req.params;
        const canvasFile = join(PROJECT_ROOT, '.lunagraph', 'canvases', canvasId, 'canvas.json');
        const content = await readFile(canvasFile, 'utf-8');
        const canvasData = JSON.parse(content);
        res.json({
            success: true,
            canvas: canvasData
        });
    }
    catch (error) {
        console.error(chalk.red('Error loading canvas:'), error);
        res.status(404).json({
            success: false,
            error: 'Canvas not found'
        });
    }
});
// List all canvases
app.get('/api/canvas', async (req, res) => {
    try {
        const canvasesDir = join(PROJECT_ROOT, '.lunagraph', 'canvases');
        // Check if directory exists
        try {
            await access(canvasesDir, constants.F_OK);
        }
        catch {
            // No canvases yet
            return res.json({
                success: true,
                canvases: []
            });
        }
        const entries = await readdir(canvasesDir, { withFileTypes: true });
        const canvases = [];
        for (const entry of entries) {
            if (entry.isDirectory()) {
                try {
                    const canvasFile = join(canvasesDir, entry.name, 'canvas.json');
                    const content = await readFile(canvasFile, 'utf-8');
                    const canvasData = JSON.parse(content);
                    canvases.push(canvasData);
                }
                catch {
                    // Skip invalid canvas directories
                }
            }
        }
        res.json({
            success: true,
            canvases
        });
    }
    catch (error) {
        console.error(chalk.red('Error listing canvases:'), error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// List canvas versions
app.get('/api/canvas/:canvasId/versions', async (req, res) => {
    try {
        const { canvasId } = req.params;
        const versionsDir = join(PROJECT_ROOT, '.lunagraph', 'canvases', canvasId, 'versions');
        // Check if versions directory exists
        try {
            await access(versionsDir, constants.F_OK);
        }
        catch {
            // No versions yet
            return res.json({
                success: true,
                versions: []
            });
        }
        const files = await readdir(versionsDir);
        const versions = files
            .filter(f => f.startsWith('canvas-') && f.endsWith('.json'))
            .sort()
            .reverse() // Newest first
            .map(filename => {
            // Extract timestamp from filename: canvas-2025-01-25T10-30-45-123Z.json
            const match = filename.match(/canvas-(.+)\.json$/);
            const timestamp = match ? match[1].replace(/-/g, (m, i) => {
                // Restore original ISO format: replace hyphens back to colons/dots appropriately
                // Format: YYYY-MM-DDTHH-MM-SS-mmmZ -> YYYY-MM-DDTHH:MM:SS.mmmZ
                return m;
            }) : '';
            return {
                filename,
                timestamp: filename.replace('canvas-', '').replace('.json', ''),
                createdAt: filename.replace('canvas-', '').replace('.json', '')
                    .replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/, '$1-$2-$3T$4:$5:$6.$7Z')
            };
        });
        res.json({
            success: true,
            versions
        });
    }
    catch (error) {
        console.error(chalk.red('Error listing canvas versions:'), error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// Restore canvas from version
app.post('/api/canvas/:canvasId/versions/:versionFilename/restore', async (req, res) => {
    try {
        const { canvasId, versionFilename } = req.params;
        const canvasDir = join(PROJECT_ROOT, '.lunagraph', 'canvases', canvasId);
        const canvasFile = join(canvasDir, 'canvas.json');
        const versionFile = join(canvasDir, 'versions', versionFilename);
        // Validate version filename (security: prevent path traversal)
        if (!/^canvas-[\d\-TZ]+\.json$/.test(versionFilename)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid version filename'
            });
        }
        // Check if version file exists
        try {
            await access(versionFile, constants.F_OK);
        }
        catch {
            return res.status(404).json({
                success: false,
                error: 'Version not found'
            });
        }
        // Create a backup of current state before restoring
        await createCanvasVersion(canvasDir, canvasFile);
        // Read version content
        const versionContent = await readFile(versionFile, 'utf-8');
        const versionData = JSON.parse(versionContent);
        // Update the version data with current timestamp
        const restoredData = {
            ...versionData,
            updatedAt: new Date().toISOString(),
            restoredFrom: versionFilename
        };
        // Write restored content to canvas.json
        await writeFile(canvasFile, JSON.stringify(restoredData, null, 2), 'utf-8');
        console.log(chalk.green('✓ Restored canvas from version:'), versionFilename);
        res.json({
            success: true,
            canvas: restoredData
        });
    }
    catch (error) {
        console.error(chalk.red('Error restoring canvas version:'), error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// Get specific version content (for preview before restore)
app.get('/api/canvas/:canvasId/versions/:versionFilename', async (req, res) => {
    try {
        const { canvasId, versionFilename } = req.params;
        const versionFile = join(PROJECT_ROOT, '.lunagraph', 'canvases', canvasId, 'versions', versionFilename);
        // Validate version filename (security: prevent path traversal)
        if (!/^canvas-[\d\-TZ]+\.json$/.test(versionFilename)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid version filename'
            });
        }
        const content = await readFile(versionFile, 'utf-8');
        const versionData = JSON.parse(content);
        res.json({
            success: true,
            version: {
                filename: versionFilename,
                canvas: versionData
            }
        });
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({
                success: false,
                error: 'Version not found'
            });
        }
        console.error(chalk.red('Error loading canvas version:'), error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// Chat History Endpoints
// Load chat history for a canvas
app.get('/api/canvas/:canvasId/chat', async (req, res) => {
    try {
        const { canvasId } = req.params;
        const chatFile = join(PROJECT_ROOT, '.lunagraph', 'canvases', canvasId, 'chat.json');
        try {
            const content = await readFile(chatFile, 'utf-8');
            const chatData = JSON.parse(content);
            res.json({ success: true, messages: chatData.messages || [] });
        }
        catch (err) {
            // No chat history yet
            if (err.code === 'ENOENT') {
                res.json({ success: true, messages: [] });
            }
            else {
                throw err;
            }
        }
    }
    catch (error) {
        console.error(chalk.red('Error loading chat history:'), error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// Save chat history for a canvas
app.post('/api/canvas/:canvasId/chat', async (req, res) => {
    try {
        const { canvasId } = req.params;
        const { messages } = req.body;
        const canvasDir = join(PROJECT_ROOT, '.lunagraph', 'canvases', canvasId);
        const chatFile = join(canvasDir, 'chat.json');
        // Ensure canvas directory exists
        await mkdir(canvasDir, { recursive: true });
        // Save chat history
        const chatData = {
            messages,
            updatedAt: new Date().toISOString()
        };
        await writeFile(chatFile, JSON.stringify(chatData, null, 2), 'utf-8');
        console.log(chalk.green('✓ Saved chat history for canvas:'), canvasId);
        res.json({ success: true });
    }
    catch (error) {
        console.error(chalk.red('Error saving chat history:'), error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// Clear chat history for a canvas
app.delete('/api/canvas/:canvasId/chat', async (req, res) => {
    try {
        const { canvasId } = req.params;
        const chatFile = join(PROJECT_ROOT, '.lunagraph', 'canvases', canvasId, 'chat.json');
        try {
            const { unlink } = await import('fs/promises');
            await unlink(chatFile);
            console.log(chalk.green('✓ Cleared chat history for canvas:'), canvasId);
        }
        catch (err) {
            // File doesn't exist, that's fine
            if (err.code !== 'ENOENT')
                throw err;
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error(chalk.red('Error clearing chat history:'), error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// Create component in canvas
app.post('/api/canvas/:canvasId/component', async (req, res) => {
    try {
        const { canvasId } = req.params;
        const { componentName, code } = req.body;
        if (!componentName || !code) {
            return res.status(400).json({
                success: false,
                error: 'Missing componentName or code'
            });
        }
        const componentDir = join(PROJECT_ROOT, '.lunagraph', 'canvases', canvasId, 'components');
        const componentFile = join(componentDir, `${componentName}.tsx`);
        const componentPath = `.lunagraph/canvases/${canvasId}/components/${componentName}.tsx`;
        // Create directory if it doesn't exist
        await mkdir(componentDir, { recursive: true });
        // Write component file
        await writeFile(componentFile, code, 'utf-8');
        console.log(chalk.green('✓ Created component:'), `${canvasId}/components/${componentName}.tsx`);
        // Update component index automatically
        try {
            const indexPath = join(PROJECT_ROOT, '.lunagraph', 'ComponentIndex.json');
            const componentsPath = join(PROJECT_ROOT, '.lunagraph', 'components.ts');
            const lunagraphDir = join(PROJECT_ROOT, '.lunagraph');
            // Create .lunagraph directory if it doesn't exist
            await mkdir(lunagraphDir, { recursive: true });
            // Read existing index
            let index = {};
            try {
                const content = await readFile(indexPath, 'utf-8');
                index = JSON.parse(content);
            }
            catch {
                // Index doesn't exist yet, start fresh
            }
            // Add new component (using named export for consistency with project conventions)
            index[componentName] = {
                path: componentPath,
                exportName: componentName
            };
            // Write updated ComponentIndex.json
            await writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');
            // Regenerate components.ts
            const imports = [];
            const componentNames = [];
            for (const [name, info] of Object.entries(index)) {
                const importPath = info.path.replace(/\.tsx?$/, '');
                if (info.exportName === 'default') {
                    imports.push(`import ${name} from '../${importPath}'`);
                }
                else {
                    imports.push(`import { ${info.exportName} as ${name} } from '../${importPath}'`);
                }
                componentNames.push(name);
            }
            const componentsContent = `// Auto-generated by @lunagraph/dev-server - do not edit manually
// This file is updated automatically when components are created

${imports.join('\n')}
import componentIndexData from './ComponentIndex.json'

// Export all components
export { ${componentNames.join(', ')} }

// Export as components object
export const components = {
  ${componentNames.join(',\n  ')}
}

// Export component index
export const componentIndex = componentIndexData
`;
            await writeFile(componentsPath, componentsContent, 'utf-8');
            console.log(chalk.green('✓ Updated component index'));
        }
        catch (indexError) {
            console.error(chalk.yellow('⚠ Failed to update component index:'), indexError);
            // Continue anyway - component file was created successfully
        }
        // Broadcast to trigger hot reload
        broadcast({
            type: 'component-created',
            canvasId,
            componentName,
            path: componentPath
        });
        res.json({
            success: true,
            componentName,
            path: componentPath
        });
    }
    catch (error) {
        console.error(chalk.red('Error creating component:'), error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// Create component from a source file (saves as sibling in same directory)
app.post('/api/component/create', async (req, res) => {
    try {
        const { sourceFilePath, componentName, code } = req.body;
        if (!sourceFilePath || !componentName || !code) {
            return res.status(400).json({
                success: false,
                error: 'Missing sourceFilePath, componentName, or code'
            });
        }
        // Get the directory of the source file
        const sourceDir = dirname(sourceFilePath);
        const componentPath = join(sourceDir, `${componentName}.tsx`);
        const validation = validatePath(componentPath);
        if (!validation.valid) {
            return res.status(403).json({
                success: false,
                error: validation.error
            });
        }
        // Check if file already exists
        try {
            await access(validation.absolutePath, constants.F_OK);
            return res.status(409).json({
                success: false,
                error: `Component file already exists: ${componentPath}`
            });
        }
        catch {
            // File doesn't exist, good to proceed
        }
        // Write component file
        await writeFile(validation.absolutePath, code, 'utf-8');
        console.log(chalk.green('✓ Created component:'), componentPath);
        // Update component index automatically
        try {
            const indexPath = join(PROJECT_ROOT, '.lunagraph', 'ComponentIndex.json');
            const componentsPath = join(PROJECT_ROOT, '.lunagraph', 'components.ts');
            const lunagraphDir = join(PROJECT_ROOT, '.lunagraph');
            // Create .lunagraph directory if it doesn't exist
            await mkdir(lunagraphDir, { recursive: true });
            // Read existing index
            let index = {};
            try {
                const content = await readFile(indexPath, 'utf-8');
                index = JSON.parse(content);
            }
            catch {
                // Index doesn't exist yet, start fresh
            }
            // Add new component (using named export for consistency with project conventions)
            index[componentName] = {
                path: componentPath,
                exportName: componentName
            };
            // Write updated ComponentIndex.json
            await writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');
            // Regenerate components.ts
            const imports = [];
            const componentNames = [];
            for (const [name, info] of Object.entries(index)) {
                const importPath = info.path.replace(/\.tsx?$/, '');
                if (info.exportName === 'default') {
                    imports.push(`import ${name} from '../${importPath}'`);
                }
                else {
                    imports.push(`import { ${info.exportName} as ${name} } from '../${importPath}'`);
                }
                componentNames.push(name);
            }
            const componentsContent = `// Auto-generated by @lunagraph/dev-server - do not edit manually
// This file is updated automatically when components are created

${imports.join('\n')}
import componentIndexData from './ComponentIndex.json'

// Export all components
export { ${componentNames.join(', ')} }

// Export as components object
export const components = {
  ${componentNames.join(',\n  ')}
}

// Export component index
export const componentIndex = componentIndexData
`;
            await writeFile(componentsPath, componentsContent, 'utf-8');
            console.log(chalk.green('✓ Updated component index'));
        }
        catch (indexError) {
            console.error(chalk.yellow('⚠ Failed to update component index:'), indexError);
            // Continue anyway - component file was created successfully
        }
        // Broadcast to trigger hot reload
        broadcast({
            type: 'component-created',
            sourceFilePath,
            componentName,
            path: componentPath
        });
        res.json({
            success: true,
            componentName,
            path: componentPath
        });
    }
    catch (error) {
        console.error(chalk.red('Error creating component:'), error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// Draft Management Endpoints
// Drafts store unsaved canvas state for components being edited
const MAX_DRAFT_VERSIONS = 20; // Keep last N versions per draft
// Helper to create a backup version of a draft before saving
async function createDraftVersion(draftsDir, draftPath) {
    try {
        // Check if current draft exists
        await access(draftPath, constants.F_OK);
        const currentContent = await readFile(draftPath, 'utf-8');
        const currentData = JSON.parse(currentContent);
        // Skip versioning if draft has no elements
        if (!currentData.elements || currentData.elements.length === 0) {
            return null;
        }
        // Create versions directory for this component
        const componentName = currentData.componentName;
        const versionsDir = join(draftsDir, 'versions', componentName);
        await mkdir(versionsDir, { recursive: true });
        // Generate version filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const versionFile = join(versionsDir, `draft-${timestamp}.json`);
        // Write version file
        await writeFile(versionFile, currentContent, 'utf-8');
        console.log(chalk.blue('  → Created draft version:'), `${componentName}/draft-${timestamp}.json`);
        // Cleanup old versions (keep only last N)
        await pruneDraftVersions(versionsDir);
        return versionFile;
    }
    catch (error) {
        // If file doesn't exist or is invalid, skip versioning
        if (error.code !== 'ENOENT') {
            console.warn(chalk.yellow('⚠ Failed to create draft version:'), error);
        }
        return null;
    }
}
// Helper to prune old draft versions, keeping only the most recent N
async function pruneDraftVersions(versionsDir) {
    try {
        const files = await readdir(versionsDir);
        const versionFiles = files
            .filter(f => f.startsWith('draft-') && f.endsWith('.json'))
            .sort()
            .reverse(); // Newest first (ISO timestamps sort alphabetically)
        // Delete old versions beyond the limit
        if (versionFiles.length > MAX_DRAFT_VERSIONS) {
            const toDelete = versionFiles.slice(MAX_DRAFT_VERSIONS);
            for (const file of toDelete) {
                const filePath = join(versionsDir, file);
                const { unlink } = await import('fs/promises');
                await unlink(filePath);
                console.log(chalk.gray('  → Pruned old draft version:'), file);
            }
        }
    }
    catch (error) {
        console.warn(chalk.yellow('⚠ Failed to prune draft versions:'), error);
    }
}
// Save draft for a component
app.post('/api/draft/save', async (req, res) => {
    try {
        const { componentName, filePath, elements, mockValues } = req.body;
        if (!componentName || !filePath || !elements) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: componentName, filePath, elements'
            });
        }
        // Get source file's modification time
        const validation = validatePath(filePath);
        let sourceFileModifiedAt = null;
        if (validation.valid && validation.absolutePath) {
            try {
                const { stat } = await import('fs/promises');
                const stats = await stat(validation.absolutePath);
                sourceFileModifiedAt = stats.mtime.toISOString();
            }
            catch {
                // Source file doesn't exist, that's ok
            }
        }
        // Create drafts directory
        const draftsDir = join(PROJECT_ROOT, '.lunagraph', 'drafts');
        await mkdir(draftsDir, { recursive: true });
        const draftPath = join(draftsDir, `${componentName}.draft.json`);
        // Create a version backup before saving (if draft already exists with content)
        await createDraftVersion(draftsDir, draftPath);
        const draftData = {
            componentName,
            filePath,
            elements,
            mockValues: mockValues || {},
            savedAt: new Date().toISOString(),
            sourceFileModifiedAt
        };
        await writeFile(draftPath, JSON.stringify(draftData, null, 2), 'utf-8');
        console.log(chalk.green('✓ Saved draft:'), componentName);
        res.json({
            success: true,
            componentName,
            savedAt: draftData.savedAt
        });
    }
    catch (error) {
        console.error(chalk.red('Error saving draft:'), error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// Load draft for a component
app.get('/api/draft/:componentName', async (req, res) => {
    try {
        const { componentName } = req.params;
        const draftPath = join(PROJECT_ROOT, '.lunagraph', 'drafts', `${componentName}.draft.json`);
        const content = await readFile(draftPath, 'utf-8');
        const draftData = JSON.parse(content);
        // Check if source file has been modified since draft was saved
        let sourceModifiedSinceDraft = false;
        if (draftData.filePath && draftData.sourceFileModifiedAt) {
            const validation = validatePath(draftData.filePath);
            if (validation.valid && validation.absolutePath) {
                try {
                    const { stat } = await import('fs/promises');
                    const stats = await stat(validation.absolutePath);
                    const currentMtime = stats.mtime.toISOString();
                    sourceModifiedSinceDraft = currentMtime > draftData.sourceFileModifiedAt;
                }
                catch {
                    // Source file doesn't exist anymore
                    sourceModifiedSinceDraft = true;
                }
            }
        }
        res.json({
            success: true,
            draft: draftData,
            sourceModifiedSinceDraft
        });
    }
    catch (error) {
        // Draft not found is not an error, just return empty
        if (error.code === 'ENOENT') {
            return res.json({
                success: true,
                draft: null
            });
        }
        console.error(chalk.red('Error loading draft:'), error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// List all drafts
app.get('/api/drafts', async (req, res) => {
    try {
        const draftsDir = join(PROJECT_ROOT, '.lunagraph', 'drafts');
        // Check if directory exists
        try {
            await access(draftsDir, constants.F_OK);
        }
        catch {
            // No drafts directory yet
            return res.json({
                success: true,
                drafts: []
            });
        }
        const files = await readdir(draftsDir);
        const draftFiles = files.filter(f => f.endsWith('.draft.json'));
        const drafts = [];
        for (const file of draftFiles) {
            try {
                const content = await readFile(join(draftsDir, file), 'utf-8');
                const data = JSON.parse(content);
                drafts.push({
                    componentName: data.componentName,
                    filePath: data.filePath,
                    savedAt: data.savedAt
                });
            }
            catch {
                // Skip invalid draft files
            }
        }
        res.json({
            success: true,
            drafts
        });
    }
    catch (error) {
        console.error(chalk.red('Error listing drafts:'), error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// List draft versions for a component
app.get('/api/draft/:componentName/versions', async (req, res) => {
    try {
        const { componentName } = req.params;
        const versionsDir = join(PROJECT_ROOT, '.lunagraph', 'drafts', 'versions', componentName);
        // Check if versions directory exists
        try {
            await access(versionsDir, constants.F_OK);
        }
        catch {
            // No versions yet
            return res.json({
                success: true,
                versions: []
            });
        }
        const files = await readdir(versionsDir);
        const versions = files
            .filter(f => f.startsWith('draft-') && f.endsWith('.json'))
            .sort()
            .reverse() // Newest first
            .map(filename => {
            // Extract timestamp from filename: draft-2026-01-28T21-45-30-123Z.json
            const timestampMatch = filename.match(/draft-(.+)\.json$/);
            const timestamp = timestampMatch ? timestampMatch[1].replace(/-/g, ':').replace(/T/g, 'T') : filename;
            return {
                filename,
                timestamp: timestamp.replace(/:/g, '-').replace('T-', 'T'),
                createdAt: new Date(timestamp.replace(/-(\d{2})-(\d{2})-(\d{3})Z$/, ':$1:$2.$3Z')).toISOString()
            };
        });
        res.json({
            success: true,
            versions
        });
    }
    catch (error) {
        console.error(chalk.red('Error listing draft versions:'), error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// Get specific draft version content
app.get('/api/draft/:componentName/versions/:versionFilename', async (req, res) => {
    try {
        const { componentName, versionFilename } = req.params;
        const versionFile = join(PROJECT_ROOT, '.lunagraph', 'drafts', 'versions', componentName, versionFilename);
        // Validate version filename (security: prevent path traversal)
        if (!/^draft-[\d\-TZ]+\.json$/.test(versionFilename)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid version filename'
            });
        }
        const content = await readFile(versionFile, 'utf-8');
        const versionData = JSON.parse(content);
        res.json({
            success: true,
            version: {
                filename: versionFilename,
                draft: versionData
            }
        });
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({
                success: false,
                error: 'Version not found'
            });
        }
        console.error(chalk.red('Error loading draft version:'), error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// Restore draft from a specific version
app.post('/api/draft/:componentName/versions/:versionFilename/restore', async (req, res) => {
    try {
        const { componentName, versionFilename } = req.params;
        const draftsDir = join(PROJECT_ROOT, '.lunagraph', 'drafts');
        const draftPath = join(draftsDir, `${componentName}.draft.json`);
        const versionFile = join(draftsDir, 'versions', componentName, versionFilename);
        // Validate version filename (security: prevent path traversal)
        if (!/^draft-[\d\-TZ]+\.json$/.test(versionFilename)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid version filename'
            });
        }
        // Check if version file exists
        try {
            await access(versionFile, constants.F_OK);
        }
        catch {
            return res.status(404).json({
                success: false,
                error: 'Version not found'
            });
        }
        // Create a backup of current draft before restoring
        await createDraftVersion(draftsDir, draftPath);
        // Read version content
        const versionContent = await readFile(versionFile, 'utf-8');
        const versionData = JSON.parse(versionContent);
        // Update with current timestamp
        const restoredData = {
            ...versionData,
            savedAt: new Date().toISOString(),
            restoredFrom: versionFilename
        };
        // Write restored content to draft file
        await writeFile(draftPath, JSON.stringify(restoredData, null, 2), 'utf-8');
        console.log(chalk.green('✓ Restored draft from version:'), versionFilename);
        res.json({
            success: true,
            draft: restoredData
        });
    }
    catch (error) {
        console.error(chalk.red('Error restoring draft version:'), error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// Delete draft for a component (archives to versions first)
app.delete('/api/draft/:componentName', async (req, res) => {
    try {
        const { componentName } = req.params;
        const draftsDir = join(PROJECT_ROOT, '.lunagraph', 'drafts');
        const draftPath = join(draftsDir, `${componentName}.draft.json`);
        // Archive the draft to versions before deleting (so we keep history)
        await createDraftVersion(draftsDir, draftPath);
        const { unlink } = await import('fs/promises');
        await unlink(draftPath);
        console.log(chalk.green('✓ Archived and deleted draft:'), componentName);
        res.json({
            success: true,
            componentName
        });
    }
    catch (error) {
        // Draft not found is not an error
        if (error.code === 'ENOENT') {
            return res.json({
                success: true,
                componentName: req.params.componentName
            });
        }
        console.error(chalk.red('Error deleting draft:'), error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// Ensure snapshots folder and index.ts exist
async function ensureSnapshotsFolder() {
    const snapshotDir = join(PROJECT_ROOT, '.lunagraph', 'snapshots');
    const indexPath = join(snapshotDir, 'index.ts');
    // Create directory
    await mkdir(snapshotDir, { recursive: true });
    // Create index.ts if it doesn't exist
    try {
        await access(indexPath, constants.F_OK);
    }
    catch {
        // File doesn't exist, create empty index
        const emptyIndex = `// Auto-generated by @lunagraph/dev-server - do not edit manually
// This file is updated when snapshots are created or modified

import type { ComponentType } from 'react'

// Version timestamp - changes on each update to trigger hot reload
export const snapshotsVersion = 1

// Export as snapshots object (for passing to LunagraphEditor)
export const snapshots: Record<string, ComponentType<any>> = {}

// Export all internal components merged together (for use in canvas)
export const internalComponents: Record<string, ComponentType<any>> = {}
`;
        await writeFile(indexPath, emptyIndex, 'utf-8');
        console.log(chalk.green('✓ Created .lunagraph/snapshots/index.ts'));
    }
}
// Start server
async function start() {
    // Load component index, check Claude availability, and ensure snapshots folder
    await Promise.all([
        loadComponentIndex(),
        checkClaudeAvailability(),
        ensureSnapshotsFolder()
    ]);
    // Determine AI provider for display
    const aiProvider = process.env.LUNAGRAPH_AI_PROVIDER || (process.env.ANTHROPIC_API_KEY ? 'api' : 'cli');
    const aiProviderDisplay = aiProvider === 'cli'
        ? 'Claude CLI (free with Max)'
        : 'Anthropic API (costs money)';
    server.listen(PORT, () => {
        console.log('');
        console.log(chalk.green.bold('🌙 Lunagraph Dev Server'));
        console.log(chalk.dim('─'.repeat(50)));
        console.log(chalk.cyan('HTTP Server:'), `http://localhost:${PORT}`);
        console.log(chalk.cyan('WebSocket:'), `ws://localhost:${PORT}`);
        console.log(chalk.cyan('Project Root:'), PROJECT_ROOT);
        console.log(chalk.cyan('Merge Strategy:'), useClaudeMerge ? 'Claude CLI (Intelligent)' : 'Deterministic (AST)');
        console.log(chalk.cyan('AI Provider:'), aiProviderDisplay);
        console.log(chalk.dim('─'.repeat(50)));
        console.log(chalk.gray('Waiting for connections...'));
        console.log('');
    });
}
start().catch(error => {
    console.error(chalk.red('Failed to start server:'), error);
    process.exit(1);
});
// Watch for file changes (like jsx-tool does)
const watcher = watch('**/*.{ts,tsx,js,jsx}', {
    ignored: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/.lunagraph/**'],
    persistent: true,
    ignoreInitial: true,
    cwd: PROJECT_ROOT
});
watcher.on('change', (filePath) => {
    console.log(chalk.yellow('File changed:'), filePath);
    broadcast({
        type: 'file-changed',
        filePath
    });
});
// Graceful shutdown
process.on('SIGINT', () => {
    console.log(chalk.yellow('\nShutting down...'));
    watcher.close();
    server.close(() => {
        console.log(chalk.green('Server closed'));
        process.exit(0);
    });
});
