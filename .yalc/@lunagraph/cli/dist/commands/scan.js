import { ComponentScanner } from '../scanner/component-scanner.js';
import * as path from 'path';
import * as fs from 'fs';
export async function scanCommand(options) {
    const cwd = process.cwd();
    const defaultPatterns = [
        'app/components/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        'src/components/**/*.{ts,tsx}',
        '.lunagraph/canvases/*/components/*.{ts,tsx}',
    ];
    // Use provided patterns or defaults (pattern is now an array)
    const patterns = options.pattern && options.pattern.length > 0 ? options.pattern : defaultPatterns;
    const outputDir = options.output ? path.dirname(options.output) : path.join(cwd, '.lunagraph');
    const outputPath = options.output || path.join(outputDir, 'ComponentIndex.json');
    const componentsPath = path.join(outputDir, 'components.ts');
    // Create output directory upfront
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`📁 Created ${outputDir}`);
    }
    console.log('🔍 Scanning for React components...');
    console.log(`   Directory: ${cwd}`);
    console.log(`   Patterns:`);
    patterns.forEach(p => console.log(`     • ${p.trim()}`));
    try {
        const scanner = new ComponentScanner(cwd);
        const index = await scanner.scanMultiple(patterns);
        const componentCount = Object.keys(index).length;
        console.log(`\n✅ Found ${componentCount} components`);
        // Display found components
        if (componentCount > 0) {
            console.log('\n📦 Components:');
            Object.entries(index).forEach(([name, info]) => {
                console.log(`   • ${name} (${info.path})`);
            });
        }
        // Write files
        await scanner.writeIndex(outputPath);
        await scanner.writeComponentsFile(componentsPath);
        console.log(`\n💾 Generated files:`);
        console.log(`   • ${outputPath}`);
        console.log(`   • ${componentsPath}`);
        console.log(`\n💡 Use in your editor page:`);
        console.log(`   import * as lunagraph from './.lunagraph/components'`);
        console.log(`   <LunagraphEditor {...lunagraph} />`);
    }
    catch (error) {
        console.error('❌ Error scanning components:', error);
        throw error;
    }
}
