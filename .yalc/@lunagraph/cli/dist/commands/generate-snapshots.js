import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { extractComponentReturn, generateSnapshot } from '@lunagraph/codegen';
import { Project, SyntaxKind, Node } from 'ts-morph';
/**
 * Extract TypeScript types from a component file using ts-morph
 */
function extractTypesFromFile(filePath, rootDir) {
    try {
        const project = new Project({
            tsConfigFilePath: path.join(rootDir, 'tsconfig.json'),
            skipAddingFilesFromTsConfig: true,
        });
        const absolutePath = path.isAbsolute(filePath)
            ? filePath
            : path.join(rootDir, filePath);
        const sourceFile = project.addSourceFileAtPath(absolutePath);
        const result = {
            props: [],
            stateVariables: [],
            internalConstants: [],
        };
        // Find the main component function
        const componentFunction = findComponentFunction(sourceFile);
        if (!componentFunction) {
            return null;
        }
        result.props = extractPropsFromFunction(componentFunction);
        result.stateVariables = extractUseStateCalls(componentFunction);
        result.internalConstants = extractInternalConstants(componentFunction);
        return result;
    }
    catch (error) {
        // Silently fail - types are optional for snapshot generation
        return null;
    }
}
function findComponentFunction(sourceFile) {
    const defaultExport = sourceFile.getDefaultExportSymbol();
    if (defaultExport) {
        const declarations = defaultExport.getDeclarations();
        for (const decl of declarations) {
            if (Node.isFunctionDeclaration(decl)) {
                return decl;
            }
            if (Node.isExportAssignment(decl)) {
                const expr = decl.getExpression();
                if (Node.isIdentifier(expr)) {
                    const funcDecl = sourceFile.getFunction(expr.getText());
                    if (funcDecl)
                        return funcDecl;
                }
            }
        }
    }
    const functions = sourceFile.getFunctions();
    for (const func of functions) {
        const body = func.getBody();
        if (body) {
            const jsxElements = body.getDescendantsOfKind(SyntaxKind.JsxElement);
            const jsxSelfClosing = body.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
            if (jsxElements.length > 0 || jsxSelfClosing.length > 0) {
                return func;
            }
        }
    }
    const variableDeclarations = sourceFile.getVariableDeclarations();
    for (const varDecl of variableDeclarations) {
        const initializer = varDecl.getInitializer();
        if (initializer && Node.isArrowFunction(initializer)) {
            const body = initializer.getBody();
            if (body && Node.isBlock(body)) {
                const jsxElements = body.getDescendantsOfKind(SyntaxKind.JsxElement);
                const jsxSelfClosing = body.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
                if (jsxElements.length > 0 || jsxSelfClosing.length > 0) {
                    return initializer;
                }
            }
        }
    }
    return null;
}
function extractPropsFromFunction(func) {
    const props = [];
    const params = func.getParameters();
    if (params.length === 0)
        return props;
    const firstParam = params[0];
    if (Node.isObjectBindingPattern(firstParam.getNameNode())) {
        const bindingPattern = firstParam.getNameNode();
        const elements = bindingPattern.getElements();
        for (const element of elements) {
            if (element.getDotDotDotToken())
                continue;
            const name = element.getName();
            const propType = element.getType();
            const typeText = propType.getText();
            const initializer = element.getInitializer();
            let defaultValue = undefined;
            if (initializer) {
                const initText = initializer.getText();
                if (initText === 'true')
                    defaultValue = true;
                else if (initText === 'false')
                    defaultValue = false;
                else if (initText === 'null')
                    defaultValue = null;
                else if (/^['"].*['"]$/.test(initText))
                    defaultValue = initText.slice(1, -1);
                else if (/^\d+$/.test(initText))
                    defaultValue = parseInt(initText, 10);
            }
            const options = parseUnionType(typeText);
            const isOptional = typeText.includes('undefined') ||
                typeText.includes('null') ||
                defaultValue !== undefined;
            props.push({
                name,
                type: typeText,
                required: !isOptional,
                options: options.length > 0 ? options : undefined,
                defaultValue,
            });
        }
    }
    return props;
}
function parseUnionType(typeText) {
    if (!typeText.includes('|'))
        return [];
    const options = [];
    const parts = typeText.split('|').map(p => p.trim());
    for (const part of parts) {
        const match = part.match(/^["'](.+)["']$/);
        if (match) {
            options.push(match[1]);
        }
    }
    return options;
}
function extractUseStateCalls(func) {
    const stateVars = [];
    const body = func.getBody();
    if (!body)
        return stateVars;
    const varDeclarations = body.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
    for (const varDecl of varDeclarations) {
        const initializer = varDecl.getInitializer();
        if (!initializer || !Node.isCallExpression(initializer))
            continue;
        const expression = initializer.getExpression();
        if (!Node.isIdentifier(expression) || expression.getText() !== 'useState')
            continue;
        const nameNode = varDecl.getNameNode();
        if (!Node.isArrayBindingPattern(nameNode))
            continue;
        const elements = nameNode.getElements();
        if (elements.length === 0)
            continue;
        const firstElement = elements[0];
        if (!Node.isBindingElement(firstElement))
            continue;
        const name = firstElement.getName();
        const typeArgs = initializer.getTypeArguments();
        let typeText;
        if (typeArgs.length > 0) {
            typeText = typeArgs[0].getText();
        }
        else {
            const args = initializer.getArguments();
            if (args.length > 0) {
                typeText = args[0].getType().getText();
            }
            else {
                typeText = 'unknown';
            }
        }
        let initialValue = undefined;
        const args = initializer.getArguments();
        if (args.length > 0) {
            const argText = args[0].getText();
            if (argText === 'true')
                initialValue = true;
            else if (argText === 'false')
                initialValue = false;
            else if (argText === 'null')
                initialValue = null;
            else if (/^['"].*['"]$/.test(argText))
                initialValue = argText.slice(1, -1);
            else if (/^\d+$/.test(argText))
                initialValue = parseInt(argText, 10);
            else if (argText.startsWith('['))
                initialValue = [];
            else if (argText.startsWith('{'))
                initialValue = {};
        }
        const options = parseUnionType(typeText);
        stateVars.push({
            name,
            type: typeText,
            required: false,
            options: options.length > 0 ? options : undefined,
            defaultValue: initialValue,
        });
    }
    return stateVars;
}
function extractInternalConstants(func) {
    const constants = [];
    const body = func.getBody();
    if (!body)
        return constants;
    const varStatements = body.getDescendantsOfKind(SyntaxKind.VariableStatement);
    for (const stmt of varStatements) {
        const declarations = stmt.getDeclarationList().getDeclarations();
        for (const decl of declarations) {
            const initializer = decl.getInitializer();
            if (!initializer)
                continue;
            if (Node.isCallExpression(initializer)) {
                const expr = initializer.getExpression();
                if (Node.isIdentifier(expr) && expr.getText().startsWith('use')) {
                    continue;
                }
            }
            if (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer)) {
                continue;
            }
            const nameNode = decl.getNameNode();
            if (!Node.isIdentifier(nameNode))
                continue;
            const name = nameNode.getText();
            const type = decl.getType().getText();
            const typeNode = decl.getTypeNode();
            const typeText = typeNode ? typeNode.getText() : type;
            constants.push({
                name,
                type: typeText,
                required: false,
            });
        }
    }
    return constants;
}
/**
 * Generate default mock value based on prop info
 */
function generateDefaultMockValue(prop) {
    const { name, initialValue, source, options, type } = prop;
    if (initialValue !== undefined) {
        return initialValue;
    }
    if (options && options.length > 0) {
        return options[0];
    }
    if (type) {
        if (/\bnumber\b/.test(type) && !/\bstring\b/.test(type)) {
            return 0;
        }
        if (type === 'boolean' || /^boolean\s*\|/.test(type) || /\|\s*boolean$/.test(type)) {
            return false;
        }
        if (type === 'string' || type === 'string | undefined' || type === 'string | null') {
            return '';
        }
    }
    if (name === 'children')
        return null;
    if (name === 'className')
        return '';
    if (name === 'style')
        return {};
    if (name === 'id')
        return '';
    if (name.startsWith('is') || name.startsWith('has') || name.startsWith('show') || name.startsWith('can')) {
        return false;
    }
    if (name === 'loading' || name === 'disabled' || name === 'checked' || name === 'open') {
        return false;
    }
    if (name.endsWith('s') || name === 'data' || name === 'items' || name === 'list') {
        return [];
    }
    if (name === 'user' || name === 'config' || name === 'options' || name === 'settings') {
        return {};
    }
    if (name === 'error') {
        return null;
    }
    if (name === 'title' || name === 'label' || name === 'text' || name === 'name' || name === 'description') {
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
    if (name === 'count' || name === 'total' || name === 'index' || name === 'page' || name === 'size') {
        return 0;
    }
    if (source === 'useContext')
        return undefined;
    if (source === 'customHook')
        return undefined;
    return undefined;
}
export async function generateSnapshotsCommand(options) {
    const cwd = process.cwd();
    const lunagraphDir = path.join(cwd, '.lunagraph');
    const indexPath = path.join(lunagraphDir, 'ComponentIndex.json');
    const snapshotDir = path.join(lunagraphDir, 'snapshots');
    console.log(chalk.blue('📸 Generating snapshots for components...'));
    // Check if ComponentIndex.json exists
    if (!fs.existsSync(indexPath)) {
        console.error(chalk.red('❌ ComponentIndex.json not found. Run `lunagraph scan` first.'));
        process.exit(1);
    }
    // Read component index
    const componentIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    const componentNames = Object.keys(componentIndex);
    if (componentNames.length === 0) {
        console.log(chalk.yellow('⚠ No components found in ComponentIndex.json'));
        return;
    }
    // Filter to specific component if provided
    const targetComponents = options.component
        ? componentNames.filter(name => name === options.component)
        : componentNames;
    if (options.component && targetComponents.length === 0) {
        console.error(chalk.red(`❌ Component "${options.component}" not found in ComponentIndex.json`));
        process.exit(1);
    }
    // Create snapshots directory
    if (!fs.existsSync(snapshotDir)) {
        fs.mkdirSync(snapshotDir, { recursive: true });
    }
    const generated = [];
    const failed = [];
    console.log(`   Found ${targetComponents.length} component(s) to process\n`);
    for (const componentName of targetComponents) {
        const info = componentIndex[componentName];
        const componentPath = info.path;
        const absolutePath = path.join(cwd, componentPath);
        process.stdout.write(`   ${componentName}... `);
        try {
            // Read source file
            if (!fs.existsSync(absolutePath)) {
                console.log(chalk.yellow('skipped (file not found)'));
                failed.push(componentName);
                continue;
            }
            const sourceCode = fs.readFileSync(absolutePath, 'utf-8');
            // Extract component data
            const extracted = extractComponentReturn(sourceCode, { targetComponentName: componentName });
            if (!extracted) {
                console.log(chalk.yellow('skipped (no component found)'));
                failed.push(componentName);
                continue;
            }
            // Extract types (optional - for better type annotations)
            const extractedTypes = extractTypesFromFile(absolutePath, cwd);
            // Generate snapshot
            const { code: snapshotCode, snapshotProps } = generateSnapshot(extracted, extractedTypes, {
                sourcePath: componentPath,
                snapshotDir: '.lunagraph/snapshots',
            });
            // Write snapshot file
            const snapshotFileName = `${componentName}.snapshot.tsx`;
            const snapshotPath = path.join(snapshotDir, snapshotFileName);
            fs.writeFileSync(snapshotPath, snapshotCode, 'utf-8');
            // Generate initial mock values
            const initialMockValues = {};
            for (const prop of snapshotProps) {
                if (!prop.hasImportDefault) {
                    initialMockValues[prop.name] = generateDefaultMockValue(prop);
                }
            }
            // Extract internal components metadata for read-only mode
            const internalComponentsMeta = extracted.internalComponents?.map(ic => ({
                name: ic.name,
                startLine: ic.startLine,
                endLine: ic.endLine,
            }));
            generated.push({
                componentName,
                snapshotComponentName: `${componentName}Snapshot`,
                filePath: componentPath,
                snapshotPath: `.lunagraph/snapshots/${snapshotFileName}`,
                snapshotProps,
                initialMockValues,
                sourceCode,
                internalComponents: internalComponentsMeta,
            });
            console.log(chalk.green('✓'));
        }
        catch (error) {
            console.log(chalk.red('failed'));
            failed.push(componentName);
            if (process.env.DEBUG) {
                console.error(chalk.dim(`     Error: ${error}`));
            }
        }
    }
    // Update snapshots index
    if (generated.length > 0) {
        await updateSnapshotsIndex(snapshotDir);
    }
    // Write metadata file for read-only mode
    const metadataPath = path.join(snapshotDir, 'metadata.json');
    const existingMetadata = fs.existsSync(metadataPath)
        ? JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
        : {};
    for (const meta of generated) {
        existingMetadata[meta.componentName] = meta;
    }
    fs.writeFileSync(metadataPath, JSON.stringify(existingMetadata, null, 2), 'utf-8');
    console.log('');
    console.log(chalk.green(`✅ Generated ${generated.length} snapshot(s)`));
    if (failed.length > 0) {
        console.log(chalk.yellow(`⚠ Skipped ${failed.length}: ${failed.join(', ')}`));
    }
    console.log('');
    console.log(chalk.dim('Generated files:'));
    console.log(chalk.dim(`   • .lunagraph/snapshots/index.ts`));
    console.log(chalk.dim(`   • .lunagraph/snapshots/metadata.json`));
    for (const meta of generated) {
        console.log(chalk.dim(`   • ${meta.snapshotPath}`));
    }
}
/**
 * Update .lunagraph/snapshots/index.ts with all snapshot exports
 */
async function updateSnapshotsIndex(snapshotDir) {
    const files = fs.readdirSync(snapshotDir);
    const snapshotFiles = files.filter(f => f.endsWith('.snapshot.tsx'));
    if (snapshotFiles.length === 0) {
        return;
    }
    const imports = [];
    const exports = [];
    const snapshotsWithInternals = [];
    for (const file of snapshotFiles) {
        const baseName = file.replace('.snapshot.tsx', '');
        const snapshotName = `${baseName}Snapshot`;
        const modulePath = `./${file.replace('.tsx', '')}`;
        const content = fs.readFileSync(path.join(snapshotDir, file), 'utf-8');
        const hasInternals = content.includes('__internalComponents');
        if (hasInternals) {
            const internalName = `__internal_${baseName}`;
            imports.push(`import ${snapshotName}, { __internalComponents as ${internalName} } from '${modulePath}'`);
            snapshotsWithInternals.push(file);
        }
        else {
            imports.push(`import ${snapshotName} from '${modulePath}'`);
        }
        exports.push(snapshotName);
    }
    const internalMerge = snapshotsWithInternals
        .map(file => `__internal_${file.replace('.snapshot.tsx', '')}`)
        .map(name => `  ...${name}`)
        .join(',\n');
    const indexContent = `// Auto-generated by @lunagraph/cli - do not edit manually
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
    const indexPath = path.join(snapshotDir, 'index.ts');
    fs.writeFileSync(indexPath, indexContent, 'utf-8');
}
