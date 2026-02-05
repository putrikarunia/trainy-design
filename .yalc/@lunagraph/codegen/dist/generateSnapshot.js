import { dirname, relative, join } from 'path';
/**
 * Generate a snapshot component file from extracted component data.
 *
 * The snapshot:
 * - Preserves all imports (filters out useState, useEffect, useContext from React)
 * - Preserves all type declarations
 * - Preserves all module-level constants and functions
 * - Converts internal state/hooks/context to props
 * - Keeps useMemo/useCallback (they compute values for render)
 * - Keeps useRef (needed for DOM references)
 * - Removes useEffect/useLayoutEffect (side effects)
 * - No-ops event handlers
 *
 * @param extracted - AST-extracted component data
 * @param extractedTypes - Optional ts-morph extracted types for better type annotations
 */
export function generateSnapshot(extracted, extractedTypes, options) {
    const snapshotProps = [];
    const lines = [];
    // Add ts-nocheck to skip TypeScript errors in generated snapshots
    // These files are auto-generated and may have type issues that don't affect runtime
    lines.push('// @ts-nocheck');
    lines.push('/* eslint-disable */');
    // Build lookup maps for extracted types
    const propTypeMap = new Map();
    const stateTypeMap = new Map();
    const constantTypeMap = new Map();
    if (extractedTypes) {
        for (const prop of extractedTypes.props) {
            propTypeMap.set(prop.name, prop);
        }
        for (const state of extractedTypes.stateVariables) {
            stateTypeMap.set(state.name, state);
        }
        for (const constant of extractedTypes.internalConstants) {
            constantTypeMap.set(constant.name, constant);
        }
    }
    // Build set of all locally defined names FIRST (from module constants and functions)
    // These are needed to filter out imports that would conflict with local declarations
    const localComponentNames = new Set();
    // Names from module-level const declarations (e.g., const Tabs = TabsPrimitive.Root)
    for (const decl of extracted.moduleConstantDeclarations) {
        const match = decl.match(/(?:const|let|var)\s+([A-Za-z0-9_]+)/);
        if (match) {
            localComponentNames.add(match[1]);
        }
    }
    // Names from module-level function declarations (e.g., function Helper() {...})
    for (const decl of extracted.moduleFunctionDeclarations) {
        // Match function declarations (with optional leading whitespace, export, async)
        const funcMatch = decl.match(/(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)/);
        if (funcMatch) {
            localComponentNames.add(funcMatch[1]);
            continue;
        }
        // Match const arrow functions (e.g., const Foo = () => ...)
        const constMatch = decl.match(/(?:const|let|var)\s+([A-Za-z0-9_]+)/);
        if (constMatch) {
            localComponentNames.add(constMatch[1]);
        }
    }
    // Names from internal components
    if (extracted.internalComponents) {
        for (const comp of extracted.internalComponents) {
            localComponentNames.add(comp.name);
        }
    }
    // 1. Generate imports (filter React hooks that become props, resolve paths)
    const filteredImports = filterImports(extracted.imports);
    const resolvedImports = options
        ? resolveImportPaths(filteredImports, options.sourcePath, options.snapshotDir)
        : filteredImports;
    // Filter out import specifiers that conflict with locally defined names
    // e.g., if we have `const Tooltip = TooltipPrimitive.Root` locally,
    // don't import `Tooltip` from elsewhere
    const deconflictedImports = resolvedImports.map(importStr => {
        // Match named imports: import { Foo, Bar, Baz } from '...'
        const match = importStr.match(/^import\s*\{([^}]+)\}\s*from\s*(['"])(.+?)\2/);
        if (!match)
            return importStr;
        const specifiers = match[1];
        const quote = match[2];
        const source = match[3];
        // Parse and filter specifiers
        const specifierList = specifiers.split(',').map(s => s.trim()).filter(Boolean);
        const filteredSpecifiers = specifierList.filter(spec => {
            // Handle aliased imports: "Foo as Bar" - check the local name (Bar)
            const aliasMatch = spec.match(/(\w+)\s+as\s+(\w+)/);
            const localName = aliasMatch ? aliasMatch[2] : spec.split(/\s+/)[0];
            return !localComponentNames.has(localName);
        });
        // If all specifiers filtered out, remove the import entirely
        if (filteredSpecifiers.length === 0) {
            return '';
        }
        // If no change, return original
        if (filteredSpecifiers.length === specifierList.length) {
            return importStr;
        }
        // Rebuild import with remaining specifiers
        return `import { ${filteredSpecifiers.join(', ')} } from ${quote}${source}${quote}`;
    }).filter(Boolean);
    // Ensure React namespace import exists (needed for React.useRef, React.useLayoutEffect in __onRender)
    const hasReactNamespaceImport = deconflictedImports.some(imp => imp.includes('* as React') || imp.match(/import\s+React\s+from/));
    if (!hasReactNamespaceImport) {
        lines.push('import * as React from "react"');
    }
    lines.push(...deconflictedImports);
    // Import sibling components from the source file so they're available in the JSX
    // This includes sibling exported components (other exported components in same file)
    // NOTE: We do NOT import internal (non-exported) components here because they are
    // already defined locally via moduleFunctionDeclarations below. Importing them would
    // cause "name is defined multiple times" errors.
    const componentsToImport = [];
    // Add sibling exported components (other exported components in same file)
    // These need to be imported since they're not included in moduleFunctionDeclarations
    if (extracted.siblingExportedComponents && extracted.siblingExportedComponents.length > 0) {
        componentsToImport.push(...extracted.siblingExportedComponents);
    }
    const filteredComponentsToImport = componentsToImport.filter(name => !localComponentNames.has(name));
    // Generate import statement if we have components to import
    if (filteredComponentsToImport.length > 0 && options) {
        // Calculate relative path from snapshot dir to source file
        let relativePath = relative(options.snapshotDir, options.sourcePath);
        // Remove .tsx/.ts extension for import
        relativePath = relativePath.replace(/\.tsx?$/, '');
        // Ensure it starts with ./ or ../
        if (!relativePath.startsWith('.')) {
            relativePath = './' + relativePath;
        }
        lines.push(`import { ${filteredComponentsToImport.join(', ')} } from '${relativePath}'`);
    }
    lines.push('');
    // 2. Add type declarations
    if (extracted.typeDeclarations.length > 0) {
        lines.push(...extracted.typeDeclarations);
        lines.push('');
    }
    // 3. Add module-level constants
    if (extracted.moduleConstantDeclarations.length > 0) {
        // Deduplicate declarations
        const seen = new Set();
        for (const decl of extracted.moduleConstantDeclarations) {
            if (!seen.has(decl)) {
                seen.add(decl);
                lines.push(decl);
            }
        }
        lines.push('');
    }
    // 4. Add module-level functions (deduplicated)
    if (extracted.moduleFunctionDeclarations.length > 0) {
        const seenFunctions = new Set();
        for (const decl of extracted.moduleFunctionDeclarations) {
            if (!seenFunctions.has(decl)) {
                seenFunctions.add(decl);
                lines.push(decl);
            }
        }
        lines.push('');
    }
    // 5. Collect all props for the snapshot component
    // Original props - use ts-morph extracted types if available
    for (const prop of extracted.props) {
        const typeInfo = propTypeMap.get(prop);
        const hasImportDefault = !!(extracted.propDefaults && extracted.propDefaults[prop]);
        snapshotProps.push({
            name: prop,
            source: 'originalProp',
            initialValue: typeInfo?.defaultValue ?? extracted.initialValues[prop],
            type: typeInfo?.type,
            options: typeInfo?.options,
            hasImportDefault,
        });
    }
    // Props from useState - use ts-morph extracted types if available
    for (const hook of extracted.hookCalls) {
        if (hook.type === 'useState') {
            for (const varName of hook.extractedVariables) {
                const typeInfo = stateTypeMap.get(varName);
                snapshotProps.push({
                    name: varName,
                    source: 'useState',
                    initialValue: typeInfo?.defaultValue ?? hook.initialValue,
                    type: typeInfo?.type,
                    options: typeInfo?.options,
                });
            }
        }
    }
    // Props from useContext
    for (const hook of extracted.hookCalls) {
        if (hook.type === 'useContext') {
            for (const varName of hook.extractedVariables) {
                snapshotProps.push({
                    name: varName,
                    source: 'useContext',
                    initialValue: undefined,
                });
            }
        }
    }
    // Props from custom hooks (only if NOT marked as keepInSnapshot)
    for (const hook of extracted.hookCalls) {
        if (hook.type === 'custom' && !hook.keepInSnapshot) {
            for (const varName of hook.extractedVariables) {
                snapshotProps.push({
                    name: varName,
                    source: 'customHook',
                    initialValue: extracted.initialValues[varName],
                });
            }
        }
    }
    // Props from internal constants (data arrays/objects that should be editable)
    // Find variable declarations that have array/object literal values
    const snapshotPropNames = new Set(snapshotProps.map(p => p.name));
    for (const decl of extracted.variableDeclarations) {
        // Match variable declarations like: const products: Product[] = [...]
        // or: const config = { ... }
        const match = decl.match(/(?:const|let|var)\s+(\w+)/);
        if (!match)
            continue;
        const varName = match[1];
        // Skip if already added as a prop
        if (snapshotPropNames.has(varName))
            continue;
        // Skip event handlers
        if (/^(handle|on)[A-Z]/.test(varName))
            continue;
        // Skip uppercase names (likely React components)
        if (/^[A-Z]/.test(varName))
            continue;
        // Skip if it references useState setter (it's a computed value)
        // e.g., const totalProducts = products.length
        let isComputed = false;
        for (const hook of extracted.hookCalls) {
            if (hook.type === 'useState' && hook.setterName) {
                if (decl.includes(hook.setterName)) {
                    isComputed = true;
                    break;
                }
            }
        }
        if (isComputed)
            continue;
        // Get the initial value if available
        const initialValue = extracted.initialValues[varName];
        // Only add if we have an initial value that's an array or object (data to edit)
        if (initialValue !== undefined && (Array.isArray(initialValue) || (typeof initialValue === 'object' && initialValue !== null))) {
            // Skip small config objects (like padding = { top: 0, ... }) that are internal implementation
            // These typically have only primitive number/string values and are not meant to be editable
            if (!Array.isArray(initialValue)) {
                const values = Object.values(initialValue);
                const isConfigObject = values.length <= 6 && values.every(v => typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean');
                if (isConfigObject)
                    continue;
            }
            const typeInfo = constantTypeMap.get(varName);
            snapshotProps.push({
                name: varName,
                source: 'internalConstant',
                initialValue: typeInfo?.defaultValue ?? initialValue,
                type: typeInfo?.type,
            });
            snapshotPropNames.add(varName);
        }
    }
    // 6. Generate the snapshot component
    const componentCode = generateSnapshotComponent(extracted, snapshotProps);
    lines.push(componentCode);
    // 7. Export internal components so they can be used in the canvas
    // Internal components are non-exported PascalCase arrow functions defined in the same file
    if (extracted.internalComponents && extracted.internalComponents.length > 0) {
        const internalNames = extracted.internalComponents.map(c => c.name);
        lines.push('');
        lines.push(`// Export internal components for use in canvas`);
        lines.push(`export const __internalComponents = { ${internalNames.join(', ')} }`);
    }
    return {
        code: lines.join('\n'),
        snapshotProps,
    };
}
/**
 * Resolve relative import paths from source location to snapshot location.
 * Handles multi-line import strings (where Babel combines multiple imports with newlines).
 */
function resolveImportPaths(imports, sourcePath, snapshotDir) {
    const sourceDir = dirname(sourcePath);
    return imports.map(importStr => {
        // Handle multi-line import strings by processing each line separately
        // Babel sometimes combines multiple import statements with newlines
        const lines = importStr.split('\n');
        const resolvedLines = lines.map(line => {
            // Match import path: from "..." or from '...'
            const match = line.match(/from\s+(['"])(.+?)\1/);
            if (!match)
                return line;
            const quote = match[1];
            const importPath = match[2];
            // Skip non-relative imports (packages, aliases like @/, etc.)
            if (!importPath.startsWith('.')) {
                return line;
            }
            // Resolve the import path relative to the source file's directory
            const absoluteImportPath = join(sourceDir, importPath);
            // Calculate relative path from snapshot directory to the resolved import
            let newRelativePath = relative(snapshotDir, absoluteImportPath);
            // Ensure it starts with ./ or ../
            if (!newRelativePath.startsWith('.')) {
                newRelativePath = './' + newRelativePath;
            }
            // Replace the import path
            return line.replace(/from\s+(['"])(.+?)\1/, `from ${quote}${newRelativePath}${quote}`);
        });
        return resolvedLines.join('\n');
    });
}
/**
 * Filter imports to remove hooks that become props
 */
function filterImports(imports) {
    const hooksToRemove = ['useState', 'useEffect', 'useLayoutEffect', 'useContext'];
    return imports.map(importStr => {
        // Check if this is a React import
        if (importStr.includes("from 'react'") || importStr.includes('from "react"')) {
            // Remove hooks that become props, keep useMemo, useCallback, useRef
            for (const hook of hooksToRemove) {
                // Remove named imports: { useState, useEffect }
                importStr = importStr.replace(new RegExp(`\\b${hook}\\b,?\\s*`, 'g'), '');
            }
            // Clean up trailing commas and empty braces
            importStr = importStr.replace(/,\s*}/, ' }');
            importStr = importStr.replace(/{\s*,/, '{ ');
            importStr = importStr.replace(/{\s*}/, '{ }');
            // If empty import, skip it
            if (importStr.includes('{ }')) {
                // Check if there's a default import
                if (!importStr.match(/import\s+\w+\s*,?\s*{\s*}/)) {
                    return ''; // Skip empty named imports
                }
                // Remove empty named imports but keep default
                importStr = importStr.replace(/,?\s*{\s*}/, '');
            }
        }
        return importStr;
    }).filter(Boolean);
}
/**
 * Generate the snapshot component function
 */
function generateSnapshotComponent(extracted, snapshotProps) {
    const lines = [];
    const componentName = extracted.componentName || 'Component';
    const snapshotName = `${componentName}Snapshot`;
    // Generate props interface
    const propsInterface = generatePropsInterface(snapshotProps, extracted);
    // Component declaration with __onRender callback for capturing the element tree
    lines.push(`export default function ${snapshotName}({`);
    lines.push(`  __onRender,`);
    // Destructure all props, preserving defaults for original props with import defaults
    const propDestructures = snapshotProps.map(p => {
        // Check if this is an original prop with an import default
        if (p.source === 'originalProp' && extracted.propDefaults && extracted.propDefaults[p.name]) {
            return `${p.name} = ${extracted.propDefaults[p.name]}`;
        }
        return p.name;
    });
    if (propDestructures.length > 0) {
        lines.push(`  ${propDestructures.join(',\n  ')},`);
    }
    lines.push(`}: ${propsInterface} & { __onRender?: (element: React.ReactElement) => void }) {`);
    // Track variables declared by hooks that we add (to avoid duplicate declarations)
    const hookDeclaredVariables = new Set();
    // Add useMemo/useCallback hooks (they compute values for render)
    for (const hook of extracted.hookCalls) {
        if (hook.type === 'useMemo' || hook.type === 'useCallback') {
            lines.push(`  ${hook.code}`);
            // Track variables declared by these hooks
            for (const varName of hook.extractedVariables) {
                hookDeclaredVariables.add(varName);
            }
        }
    }
    // Add useRef hooks (needed for DOM references)
    for (const hook of extracted.hookCalls) {
        if (hook.type === 'useRef') {
            lines.push(`  ${hook.code}`);
            // Track variables declared by useRef
            for (const varName of hook.extractedVariables) {
                hookDeclaredVariables.add(varName);
            }
        }
    }
    // Create no-op setters for ALL useState hooks
    // These setters might be used in JSX (e.g., onSelectSlide={setSelectedSlide})
    // or by custom hooks that must stay in the snapshot
    for (const hook of extracted.hookCalls) {
        if (hook.type === 'useState' && hook.setterName) {
            lines.push(`  const ${hook.setterName} = () => {}`);
        }
    }
    // Now add the custom hooks that need to stay
    for (const hook of extracted.hookCalls) {
        if (hook.type === 'custom' && hook.keepInSnapshot) {
            lines.push(`  ${hook.code}`);
            // Track variables declared by custom hooks
            for (const varName of hook.extractedVariables) {
                hookDeclaredVariables.add(varName);
            }
        }
    }
    // Track which declarations we've already added
    const addedDeclarations = new Set();
    const eventHandlerPattern = /^(handle|on)[A-Z]/;
    // Build set of prop names to skip in variable declarations
    const snapshotPropNames = new Set(snapshotProps.map(p => p.name));
    // Add all variable declarations from component body
    // These include computed values, helper functions, etc.
    for (const decl of extracted.variableDeclarations) {
        if (addedDeclarations.has(decl))
            continue;
        // Match variable declarations, handling TypeScript type annotations
        // e.g., "const foo = ..." or "const foo: Type = ..."
        const match = decl.match(/(?:const|let|var)\s+(\w+)\s*[=:]/);
        if (match) {
            const varName = match[1];
            // Skip if this variable has been converted to a prop (will come in as parameter)
            if (snapshotPropNames.has(varName)) {
                addedDeclarations.add(decl);
                continue;
            }
            // Skip if this variable was already declared by a hook (useMemo, useCallback, useRef, custom)
            if (hookDeclaredVariables.has(varName)) {
                addedDeclarations.add(decl);
                continue;
            }
            // Convert event handlers to no-ops
            if (eventHandlerPattern.test(varName)) {
                lines.push(`  const ${varName} = () => {}`);
                addedDeclarations.add(decl);
                continue;
            }
            // Skip if it looks like a hook call (already handled above)
            // But only if 'use' appears at the start of a word (e.g., useState, useRef)
            // not in the middle of words like "hasImageReference"
            const isHookCall = /\buse[A-Z]\w*\s*\(/.test(decl);
            if (isHookCall) {
                continue;
            }
            // Add all other declarations (computed values, helper vars, etc.)
            lines.push(`  ${decl}`);
            addedDeclarations.add(decl);
        }
    }
    // Add function declarations from component body
    for (const decl of extracted.variableDeclarations) {
        if (addedDeclarations.has(decl))
            continue;
        if (decl.startsWith('function ')) {
            lines.push(`  ${decl}`);
            addedDeclarations.add(decl);
        }
    }
    // Check if we have conditional returns (if/return pattern)
    if (extracted.conditionalReturns && extracted.conditionalReturns.length > 1) {
        // Use ref-based pattern to capture whichever element gets returned
        lines.push('');
        lines.push(`  // Ref to capture which element is returned (for conditional rendering)`);
        lines.push(`  const __elementRef = React.useRef<React.ReactElement | null>(null)`);
        lines.push('');
        lines.push(`  // Create stable key from all props for dependency tracking`);
        lines.push(`  // Use try-catch to handle non-serializable values (React elements, functions, etc.)`);
        lines.push(`  const __propsKey = React.useMemo(() => {`);
        lines.push(`    try {`);
        lines.push(`      return JSON.stringify({ ${snapshotProps.map(p => p.name).join(', ')} }, (key, value) => {`);
        lines.push(`        if (React.isValidElement(value)) return '[ReactElement]'`);
        lines.push(`        if (typeof value === 'function') return '[Function]'`);
        lines.push(`        return value`);
        lines.push(`      })`);
        lines.push(`    } catch { return String(Date.now()) }`);
        lines.push(`  }, [${snapshotProps.map(p => p.name).join(', ')}])`);
        lines.push('');
        lines.push(`  // Pass element tree to parent via callback when props change`);
        lines.push(`  React.useLayoutEffect(() => {`);
        lines.push(`    if (__onRender && __elementRef.current) {`);
        lines.push(`      __onRender(__elementRef.current)`);
        lines.push(`    }`);
        lines.push(`  }, [__propsKey, __onRender])`);
        lines.push('');
        // Generate conditional return structure
        // Use unique variable names to avoid duplicate definitions
        let elIndex = 0;
        for (const cr of extracted.conditionalReturns) {
            const elName = `__el${elIndex}`;
            elIndex++;
            if (cr.condition) {
                // Conditional return: if (condition) { ... return }
                lines.push(`  if (${cr.condition}) {`);
                lines.push(`    const ${elName} = (`);
                lines.push(`      ${cr.jsx}`);
                lines.push(`    )`);
                lines.push(`    __elementRef.current = ${elName}`);
                lines.push(`    return ${elName}`);
                lines.push(`  }`);
                lines.push('');
            }
            else {
                // Default return (no condition) - wrap in block for scope isolation
                lines.push(`  {`);
                lines.push(`    const ${elName} = (`);
                lines.push(`      ${cr.jsx}`);
                lines.push(`    )`);
                lines.push(`    __elementRef.current = ${elName}`);
                lines.push(`    return ${elName}`);
                lines.push(`  }`);
            }
        }
    }
    else {
        // Simple single return - use existing pattern
        lines.push('');
        lines.push(`  const __element = (`);
        lines.push(`    ${extracted.returnJSX}`);
        lines.push(`  )`);
        lines.push('');
        lines.push(`  // Create stable key from all props for dependency tracking`);
        lines.push(`  // Use try-catch to handle non-serializable values (React elements, functions, etc.)`);
        lines.push(`  const __propsKey = React.useMemo(() => {`);
        lines.push(`    try {`);
        lines.push(`      return JSON.stringify({ ${snapshotProps.map(p => p.name).join(', ')} }, (key, value) => {`);
        lines.push(`        if (React.isValidElement(value)) return '[ReactElement]'`);
        lines.push(`        if (typeof value === 'function') return '[Function]'`);
        lines.push(`        return value`);
        lines.push(`      })`);
        lines.push(`    } catch { return String(Date.now()) }`);
        lines.push(`  }, [${snapshotProps.map(p => p.name).join(', ')}])`);
        lines.push('');
        lines.push(`  // Pass element tree to parent via callback when props change`);
        lines.push(`  // Use useLayoutEffect to ensure we capture the tree before paint`);
        lines.push(`  React.useLayoutEffect(() => {`);
        lines.push(`    if (__onRender) {`);
        lines.push(`      __onRender(__element)`);
        lines.push(`    }`);
        lines.push(`  }, [__propsKey, __onRender])`);
        lines.push('');
        lines.push(`  // Return the actual element for rendering in canvas`);
        lines.push(`  return __element`);
    }
    lines.push(`}`);
    return lines.join('\n');
}
/**
 * Generate TypeScript props interface for the snapshot
 */
function generatePropsInterface(snapshotProps, extracted) {
    const propTypes = [];
    for (const prop of snapshotProps) {
        let type = 'any';
        // FIRST: Use ts-morph extracted type if available (most accurate)
        if (prop.type) {
            type = prop.type;
        }
        // FALLBACK: Try to infer type from initial value
        else if (prop.initialValue !== undefined) {
            if (typeof prop.initialValue === 'boolean')
                type = 'boolean';
            else if (typeof prop.initialValue === 'number')
                type = 'number';
            else if (typeof prop.initialValue === 'string')
                type = 'string';
            else if (Array.isArray(prop.initialValue))
                type = 'any[]';
            else if (typeof prop.initialValue === 'object' && prop.initialValue !== null)
                type = 'Record<string, any>';
            else if (typeof prop.initialValue === 'function')
                type = '(...args: any[]) => any';
        }
        // FALLBACK: Common naming patterns
        else {
            if (prop.name.startsWith('is') || prop.name.startsWith('has') || prop.name.startsWith('show')) {
                type = 'boolean';
            }
            if (prop.name === 'children') {
                type = 'React.ReactNode';
            }
            if (prop.name === 'className' || prop.name === 'id') {
                type = 'string';
            }
            if (prop.name === 'style') {
                type = 'React.CSSProperties';
            }
        }
        propTypes.push(`${prop.name}?: ${type}`);
    }
    return `{\n  ${propTypes.join('\n  ')}\n}`;
}
