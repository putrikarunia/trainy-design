/**
 * Calculate relative import path from source file to target file
 * Example: from '.lunagraph/canvases/canvas-1/components/Foo.tsx' to 'components/ui/text.tsx'
 * Returns: '../../../../components/ui/text'
 */
function calculateRelativePath(fromFile, toFile) {
    // Remove filename from fromFile to get directory
    const fromParts = fromFile.split('/').slice(0, -1);
    const toParts = toFile.split('/');
    // Find common prefix
    let commonLength = 0;
    const minLength = Math.min(fromParts.length, toParts.length);
    for (let i = 0; i < minLength; i++) {
        if (fromParts[i] === toParts[i]) {
            commonLength++;
        }
        else {
            break;
        }
    }
    // Calculate how many levels to go up
    const upLevels = fromParts.length - commonLength;
    const relativeParts = toParts.slice(commonLength);
    // Build relative path
    const upPath = '../'.repeat(upLevels);
    const relPath = upPath + relativeParts.join('/');
    // Ensure it starts with ./ or ../
    return relPath.startsWith('.') ? relPath : './' + relPath;
}
/**
 * Generate import statements from component dependencies
 *
 * @param componentNames - Set of component names used in the JSX
 * @param componentIndex - ComponentIndex.json mapping
 * @param targetFilePath - Path of the file being generated (for relative imports)
 * @returns Array of import statements
 */
export function generateImports(componentNames, componentIndex, targetFilePath) {
    const imports = [];
    // Group components by their source file
    const importsByPath = new Map();
    for (const componentName of componentNames) {
        const entry = componentIndex[componentName];
        if (!entry) {
            console.warn(`Component "${componentName}" not found in ComponentIndex`);
            continue;
        }
        const { path, exportName } = entry;
        if (!importsByPath.has(path)) {
            importsByPath.set(path, new Set());
        }
        importsByPath.get(path).add(exportName);
    }
    // Generate import statements
    for (const [path, exportNames] of importsByPath) {
        // Convert file path to import path (remove .tsx/.ts extension)
        const importPath = path.replace(/\.tsx?$/, '');
        // If multiple exports from same file, combine them
        const namedImports = Array.from(exportNames).sort().join(', ');
        // Calculate final import path
        let finalPath;
        if (targetFilePath) {
            // Calculate relative path from targetFilePath to importPath
            finalPath = calculateRelativePath(targetFilePath, importPath);
        }
        else {
            // Fallback to @ alias
            finalPath = importPath.startsWith('@/') ? importPath : `@/${importPath}`;
        }
        imports.push(`import { ${namedImports} } from '${finalPath}'`);
    }
    return imports.sort();
}
/**
 * Generate import statements for icons grouped by library
 *
 * @param iconsByLibrary - Map of library name -> Set of icon names
 * @returns Array of import statements
 */
export function generateIconImports(iconsByLibrary) {
    const imports = [];
    for (const [library, iconNames] of iconsByLibrary) {
        const sortedNames = Array.from(iconNames).sort().join(', ');
        imports.push(`import { ${sortedNames} } from '${library}'`);
    }
    return imports.sort();
}
/**
 * Get component import mappings (for use in prompts/hints)
 * Returns array of { component, importPath } objects
 */
export function getComponentImportMappings(componentNames, componentIndex) {
    const mappings = [];
    for (const componentName of componentNames) {
        const entry = componentIndex[componentName];
        if (!entry) {
            console.warn(`Component "${componentName}" not found in ComponentIndex`);
            continue;
        }
        const { path, exportName } = entry;
        const importPath = path.replace(/\.tsx?$/, '');
        const finalPath = importPath.startsWith('@/') ? importPath : `@/${importPath}`;
        mappings.push({
            component: exportName,
            importPath: finalPath
        });
    }
    return mappings;
}
