import { generateJSX } from './generateJSX.js';
import { extractComponentDependencies, extractIconDependencies } from './extractDependencies.js';
import { generateImports, generateIconImports } from './generateImports.js';
/**
 * Generate a complete TypeScript/React component file
 */
export function generateCompleteFile(options) {
    const { componentName, elements, componentIndex, targetFilePath, includeReactImport = false } = options;
    const parts = [];
    // Extract component dependencies
    const componentDeps = extractComponentDependencies(elements);
    // Extract icon dependencies
    const iconDeps = extractIconDependencies(elements);
    // Generate imports
    const componentImports = generateImports(componentDeps, componentIndex, targetFilePath);
    const iconImports = generateIconImports(iconDeps);
    // Add React import if needed (for older React versions or explicit request)
    if (includeReactImport) {
        parts.push("import React from 'react'");
    }
    // Add icon imports (usually from external packages, so put first)
    if (iconImports.length > 0) {
        parts.push(...iconImports);
    }
    // Add component imports
    if (componentImports.length > 0) {
        parts.push(...componentImports);
    }
    // Add blank line after imports
    if (parts.length > 0) {
        parts.push('');
    }
    // Generate component definition (named export for consistency with project conventions)
    parts.push(`export function ${componentName}() {`);
    parts.push('  return (');
    // Generate JSX (indented by 2 spaces for return statement)
    const jsx = generateJSX(elements, 2);
    parts.push(jsx);
    parts.push('  )');
    parts.push('}');
    return parts.join('\n');
}
