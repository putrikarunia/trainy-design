import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
const AI_PREAMBLE = `# Lunagraph Setup Instructions

You are helping set up Lunagraph, a visual React component editor. The user has already configured authentication (.npmrc) and installed packages. Complete the remaining setup.

## Your Tasks

1. **Check LUNAGRAPH_TOKEN exists** - Verify the token is exported in ~/.zshrc:
   \`\`\`bash
   grep LUNAGRAPH_TOKEN ~/.zshrc
   \`\`\`
   If not found, ask the user to add it.

2. **Add reference to Lunagraph instructions** - Add this line to your AI agent's rules file (\`AGENTS.md\`, \`.claude/CLAUDE.md\`, \`.cursor/rules\`, etc.):
   \`\`\`
   When working with React components, follow the guidelines in \`.lunagraph/INSTRUCTIONS.md\`.
   \`\`\`

3. **Add scripts to package.json**:
   \`\`\`json
   {
     "scripts": {
       "scan": "lunagraph scan",
       "generate-snapshots": "lunagraph generate-snapshots",
       "prebuild": "pnpm scan && pnpm generate-snapshots",
       "lunagraph:server": "lunagraph-dev"
     }
   }
   \`\`\`
   Then ask the user to run \`pnpm scan\` in their terminal to generate the .lunagraph/ folder.

4. **Follow the setup instructions below** - Read the Manual Setup section and complete all steps:
   - Create the editor page (\`app/editor/page.tsx\`)
   - **Create the read-only editor page (\`app/editor-read-only/page.tsx\`)** - THIS IS REQUIRED for production deployments
   - Configure CSS import order
   - Configure Tailwind
   - Optionally set up icon libraries

5. **IMPORTANT: Create both editor pages**
   - \`app/editor/page.tsx\` - Full editor for development (requires dev server)
   - \`app/editor-read-only/page.tsx\` - Read-only viewer for production (no dev server needed)
   
   The read-only page MUST include:
   - \`snapshotMetadata\` prop (import from \`.lunagraph/snapshots/metadata.json\`)
   - \`readOnly\` prop
   
   Example:
   \`\`\`tsx
   import snapshotMetadata from '../../.lunagraph/snapshots/metadata.json';
   
   <LunagraphEditor
     {...lunagraph}
     snapshots={snapshots}
     snapshotMetadata={snapshotMetadata}
     initialElements={canvasData.elements}
     readOnly
   />
   \`\`\`

6. **For Vite projects** - Pass the dev server URL as a prop:
   \`\`\`tsx
   <LunagraphEditor
     {...lunagraph}
     devServerUrl={import.meta.env.VITE_LUNAGRAPH_DEV_SERVER || 'http://localhost:4001'}
   />
   \`\`\`

7. **For Vercel deployments** - The \`prebuild\` script automatically runs before build:
   \`\`\`json
   "prebuild": "pnpm scan && pnpm generate-snapshots"
   \`\`\`
   This generates snapshots so the read-only editor works without a dev server.

---

`;
function getReadmeContent() {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        // Go up from dist/commands/ to package root
        const packageRoot = path.resolve(__dirname, '..', '..');
        const readmePath = path.join(packageRoot, 'SETUP_README.md');
        if (fs.existsSync(readmePath)) {
            const content = fs.readFileSync(readmePath, 'utf-8');
            // Extract just the Manual Setup section onwards (skip installation steps)
            const manualSetupMatch = content.match(/### Manual Setup \(without AI\)[\s\S]*/);
            if (manualSetupMatch) {
                // Remove the <details> wrapper and summary
                let section = manualSetupMatch[0];
                section = section.replace(/<details>\s*<summary>.*?<\/summary>/s, '');
                section = section.replace(/<\/details>/, '');
                return section.trim();
            }
            return content;
        }
    }
    catch (e) {
        // Fall through to fallback
    }
    return `(Could not load README.md - please refer to https://github.com/lunagraph/lunagraph for setup instructions)`;
}
export async function setupCommand(options) {
    if (options.prompt) {
        const readmeContent = getReadmeContent();
        const fullInstructions = AI_PREAMBLE + readmeContent;
        // Output the prompt for the user to paste into their AI assistant
        console.log('\n' + '='.repeat(60));
        console.log('📋 Copy the prompt below and paste it into Cursor/Claude:');
        console.log('='.repeat(60) + '\n');
        console.log(fullInstructions);
        console.log('\n' + '='.repeat(60));
        console.log('💡 Paste this into Cursor (Cmd+L) or Claude and let it set up your project!');
        console.log('='.repeat(60) + '\n');
    }
    else {
        console.log('🛠️  Lunagraph Setup');
        console.log('');
        console.log('Usage:');
        console.log('  lunagraph setup --prompt    Output a prompt to paste into Cursor/Claude');
        console.log('');
        console.log('This generates a prompt that your AI assistant can use to');
        console.log('analyze your project and set up Lunagraph correctly.');
    }
}
