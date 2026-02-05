import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import * as t from '@babel/types';
const traverse = traverseModule.default || traverseModule;
const generate = generateModule.default || generateModule;
/**
 * Check if a CallExpression is a React.forwardRef or forwardRef call
 */
function isForwardRefCall(node) {
    const callee = node.callee;
    // React.forwardRef
    if (t.isMemberExpression(callee) &&
        t.isIdentifier(callee.object, { name: 'React' }) &&
        t.isIdentifier(callee.property, { name: 'forwardRef' })) {
        return true;
    }
    // forwardRef (direct import)
    if (t.isIdentifier(callee, { name: 'forwardRef' })) {
        return true;
    }
    return false;
}
/**
 * Extracts the return statement JSX and finds all variables used in it
 */
export function extractComponentReturn(code, options = {}) {
    try {
        const ast = parse(code, {
            sourceType: 'module',
            plugins: ['jsx', 'typescript'],
        });
        const { targetComponentName } = options;
        // Collect module-level info first (these are shared across all components)
        const importedNames = new Set();
        const imports = [];
        const typeDeclarations = [];
        const moduleConstants = {};
        const moduleConstantDeclarations = [];
        const moduleFunctionDeclarations = [];
        // Extract imports (full statements + names)
        extractImports(ast, imports, importedNames);
        // Extract type/interface declarations
        extractTypeDeclarations(ast, typeDeclarations);
        // Extract module-level constants (values + declarations)
        extractModuleLevelConstants(ast, moduleConstants, moduleConstantDeclarations);
        // Extract module-level function declarations (excluding the target component)
        extractModuleFunctionDeclarations(ast, moduleFunctionDeclarations, targetComponentName);
        // Internal components will be extracted after we know which are exported
        const internalComponents = [];
        // Collect all exported component names for priority detection
        const exportedNames = new Set();
        const defaultExportedNames = new Set();
        traverse(ast, {
            ExportNamedDeclaration(path) {
                // export { Foo, Bar }
                for (const spec of path.node.specifiers || []) {
                    if (t.isExportSpecifier(spec) && t.isIdentifier(spec.exported)) {
                        exportedNames.add(spec.exported.name);
                    }
                }
                // export const Foo = ...
                const decl = path.node.declaration;
                if (decl && t.isVariableDeclaration(decl)) {
                    for (const d of decl.declarations) {
                        if (t.isIdentifier(d.id)) {
                            exportedNames.add(d.id.name);
                        }
                    }
                }
                // export function Foo() { ... }
                if (decl && t.isFunctionDeclaration(decl) && decl.id) {
                    exportedNames.add(decl.id.name);
                }
            },
            ExportDefaultDeclaration(path) {
                const decl = path.node.declaration;
                if (t.isFunctionDeclaration(decl) && decl.id) {
                    defaultExportedNames.add(decl.id.name);
                    exportedNames.add(decl.id.name);
                }
                if (t.isIdentifier(decl)) {
                    defaultExportedNames.add(decl.name);
                    exportedNames.add(decl.name);
                }
            },
        });
        // Extract internal components (non-exported PascalCase components)
        // These are helper components defined in the same file
        extractInternalComponents(ast, internalComponents, exportedNames, targetComponentName);
        // Collect all component names (without storing paths - paths become stale after traversal)
        const candidates = [];
        traverse(ast, {
            // Handle function declarations: function MyComponent() { ... }
            FunctionDeclaration(path) {
                if (path.node.id && t.isIdentifier(path.node.id)) {
                    const name = path.node.id.name;
                    // Only consider PascalCase names as components
                    if (/^[A-Z]/.test(name)) {
                        candidates.push({
                            name,
                            isDefaultExport: defaultExportedNames.has(name),
                            isNamedExport: exportedNames.has(name),
                        });
                    }
                }
            },
            // Handle arrow functions: const MyComponent = () => { ... }
            VariableDeclaration(path) {
                for (let i = 0; i < path.node.declarations.length; i++) {
                    const declarator = path.node.declarations[i];
                    if (!t.isIdentifier(declarator.id))
                        continue;
                    const name = declarator.id.name;
                    // Only consider PascalCase names as components
                    if (!/^[A-Z]/.test(name))
                        continue;
                    let init = declarator.init;
                    if (t.isTSAsExpression(init)) {
                        init = init.expression;
                    }
                    // Arrow function or forwardRef
                    if (t.isArrowFunctionExpression(init) ||
                        (t.isCallExpression(init) && isForwardRefCall(init))) {
                        candidates.push({
                            name,
                            isDefaultExport: defaultExportedNames.has(name),
                            isNamedExport: exportedNames.has(name),
                        });
                    }
                }
            },
            // Handle default export function: export default function() { ... }
            ExportDefaultDeclaration(path) {
                const decl = path.node.declaration;
                if (t.isFunctionDeclaration(decl)) {
                    const name = decl.id && t.isIdentifier(decl.id) ? decl.id.name : 'Component';
                    // Only add if not already added
                    if (!candidates.some(c => c.name === name)) {
                        candidates.push({
                            name,
                            isDefaultExport: true,
                            isNamedExport: false,
                        });
                    }
                }
            },
        });
        if (candidates.length === 0) {
            return null;
        }
        // Priority (respect what the user explicitly selected):
        // 1. Exact match with target name (user clicked on this specific component)
        // 2. Default exported component (if no target specified)
        // 3. First named exported component
        // 4. First component found (fallback)
        let selectedName = null;
        // 1. Exact match with target name - user explicitly selected this component
        if (targetComponentName) {
            const match = candidates.find(c => c.name === targetComponentName) ||
                candidates.find(c => c.name.toLowerCase() === targetComponentName.toLowerCase());
            if (match)
                selectedName = match.name;
        }
        // 2. Default export (if no target or target not found)
        if (!selectedName) {
            const match = candidates.find(c => c.isDefaultExport);
            if (match)
                selectedName = match.name;
        }
        // 3. First named export
        if (!selectedName) {
            const match = candidates.find(c => c.isNamedExport);
            if (match)
                selectedName = match.name;
        }
        // 4. First component (fallback)
        if (!selectedName) {
            selectedName = candidates[0].name;
        }
        // Now do a second traversal to extract from the selected component
        const variables = new Set();
        const props = new Set();
        const propDefaults = {};
        const initialValues = {};
        const variableDeclarations = [];
        const hookCalls = [];
        let componentName = selectedName;
        let propsType = null;
        let result = null;
        // Second traversal to extract from the selected component
        traverse(ast, {
            FunctionDeclaration(path) {
                if (result)
                    return;
                if (path.node.id && t.isIdentifier(path.node.id) && path.node.id.name === selectedName) {
                    propsType = extractPropsType(path.node.params);
                    result = extractFromFunction(path, variables, props, propDefaults, initialValues, variableDeclarations, hookCalls);
                }
            },
            VariableDeclaration(path) {
                if (result)
                    return;
                for (let i = 0; i < path.node.declarations.length; i++) {
                    const declarator = path.node.declarations[i];
                    if (!t.isIdentifier(declarator.id))
                        continue;
                    if (declarator.id.name !== selectedName)
                        continue;
                    let init = declarator.init;
                    if (t.isTSAsExpression(init)) {
                        init = init.expression;
                    }
                    // Arrow function
                    if (t.isArrowFunctionExpression(init)) {
                        propsType = extractPropsType(init.params);
                        const funcPath = path.get(`declarations.${i}.init`);
                        result = extractFromFunction(funcPath, variables, props, propDefaults, initialValues, variableDeclarations, hookCalls);
                        return;
                    }
                    // forwardRef
                    if (t.isCallExpression(init) && isForwardRefCall(init)) {
                        const callbackArg = init.arguments[0];
                        if (t.isArrowFunctionExpression(callbackArg) || t.isFunctionExpression(callbackArg) || t.isTSAsExpression(callbackArg)) {
                            let finalCallback = callbackArg;
                            if (t.isTSAsExpression(finalCallback)) {
                                finalCallback = finalCallback.expression;
                            }
                            if (!t.isArrowFunctionExpression(finalCallback) && !t.isFunctionExpression(finalCallback)) {
                                return;
                            }
                            propsType = extractPropsType(finalCallback.params);
                            const callbackPath = path.get(`declarations.${i}.init`);
                            const finalPath = callbackPath.isTSAsExpression() ? callbackPath.get('expression') : callbackPath;
                            result = extractFromFunction(finalPath.get('arguments.0'), variables, props, propDefaults, initialValues, variableDeclarations, hookCalls);
                            return;
                        }
                    }
                }
            },
            ExportDefaultDeclaration(path) {
                if (result)
                    return;
                const decl = path.node.declaration;
                if (t.isFunctionDeclaration(decl)) {
                    const name = decl.id && t.isIdentifier(decl.id) ? decl.id.name : 'Component';
                    if (name === selectedName) {
                        propsType = extractPropsType(decl.params);
                        const funcPath = path.get('declaration');
                        result = extractFromFunction(funcPath, variables, props, propDefaults, initialValues, variableDeclarations, hookCalls);
                    }
                }
            },
        });
        if (!result) {
            return null;
        }
        // Extract values from result (TypeScript needs this due to traverse callback)
        const { returnJSX, conditionalReturns } = result;
        // Compute sibling exported components (other exported PascalCase components in same file)
        const siblingExportedComponents = Array.from(exportedNames).filter(name => name !== componentName && /^[A-Z]/.test(name));
        return {
            componentName,
            propsType,
            imports,
            importedNames: Array.from(importedNames),
            typeDeclarations,
            moduleConstants,
            moduleConstantDeclarations,
            moduleFunctionDeclarations,
            props: Array.from(props),
            propDefaults,
            hookCalls,
            variableDeclarations,
            initialValues,
            variables: Array.from(variables),
            returnJSX,
            conditionalReturns,
            internalComponents: internalComponents.length > 0 ? internalComponents : undefined,
            siblingExportedComponents: siblingExportedComponents.length > 0 ? siblingExportedComponents : undefined,
        };
    }
    catch (error) {
        console.error('Failed to extract component return:', error);
        return null;
    }
}
/**
 * Extract full import statements and imported names
 */
function extractImports(ast, imports, importedNames) {
    traverse(ast, {
        ImportDeclaration(path) {
            // Get full import statement
            imports.push(generate(path.node).code);
            // Extract all imported specifiers
            for (const specifier of path.node.specifiers) {
                if (t.isImportSpecifier(specifier)) {
                    importedNames.add(specifier.local.name);
                }
                else if (t.isImportDefaultSpecifier(specifier)) {
                    importedNames.add(specifier.local.name);
                }
                else if (t.isImportNamespaceSpecifier(specifier)) {
                    importedNames.add(specifier.local.name);
                }
            }
        }
    });
}
/**
 * Extract type and interface declarations
 */
function extractTypeDeclarations(ast, typeDeclarations) {
    traverse(ast, {
        TSTypeAliasDeclaration(path) {
            typeDeclarations.push(generate(path.node).code);
        },
        TSInterfaceDeclaration(path) {
            typeDeclarations.push(generate(path.node).code);
        },
    });
}
/**
 * Extract module-level function declarations (function foo() {...}) and
 * arrow function components (const Foo = () => {...})
 */
function extractModuleFunctionDeclarations(ast, declarations, targetComponentName) {
    // First, collect all exported names (we should skip exported components)
    const exportedNames = new Set();
    traverse(ast, {
        ExportNamedDeclaration(path) {
            if (path.node.declaration) {
                if (t.isFunctionDeclaration(path.node.declaration)) {
                    if (path.node.declaration.id) {
                        exportedNames.add(path.node.declaration.id.name);
                    }
                }
                // Also handle exported arrow functions: export const Foo = () => {}
                if (t.isVariableDeclaration(path.node.declaration)) {
                    for (const declarator of path.node.declaration.declarations) {
                        if (t.isIdentifier(declarator.id)) {
                            exportedNames.add(declarator.id.name);
                        }
                    }
                }
            }
            // Handle export { Foo, Bar }
            if (path.node.specifiers) {
                for (const spec of path.node.specifiers) {
                    if (t.isExportSpecifier(spec) && t.isIdentifier(spec.exported)) {
                        exportedNames.add(spec.exported.name);
                    }
                }
            }
        },
        ExportDefaultDeclaration(path) {
            if (t.isFunctionDeclaration(path.node.declaration) && path.node.declaration.id) {
                exportedNames.add(path.node.declaration.id.name);
            }
            // Handle: export default Foo (where Foo is defined elsewhere)
            if (t.isIdentifier(path.node.declaration)) {
                exportedNames.add(path.node.declaration.name);
            }
        }
    });
    traverse(ast, {
        Program(programPath) {
            for (const statement of programPath.node.body) {
                // function formatPrice() { ... } or function Step1BasicInfo() { ... }
                if (t.isFunctionDeclaration(statement)) {
                    if (statement.id && t.isIdentifier(statement.id)) {
                        const name = statement.id.name;
                        // Skip the target component itself (we're generating a snapshot for it)
                        if (name === targetComponentName)
                            continue;
                        // Skip exported components (they should have their own snapshots)
                        if (exportedNames.has(name))
                            continue;
                        // Include all other functions, including PascalCase helper components
                        // that are not exported (they're internal to this file)
                        declarations.push(generate(statement).code);
                    }
                }
                // Also handle arrow function components: const Foo = () => { ... }
                // These need to be included for internal components to work
                if (t.isVariableDeclaration(statement)) {
                    for (const declarator of statement.declarations) {
                        if (t.isIdentifier(declarator.id)) {
                            const name = declarator.id.name;
                            // Only include PascalCase names (likely components)
                            if (!/^[A-Z]/.test(name))
                                continue;
                            // Skip the target component itself
                            if (name === targetComponentName)
                                continue;
                            // Skip exported components
                            if (exportedNames.has(name))
                                continue;
                            // Only include arrow functions or function expressions
                            const init = declarator.init;
                            if (!init)
                                continue;
                            if (!t.isArrowFunctionExpression(init) && !t.isFunctionExpression(init))
                                continue;
                            // Include this arrow function component
                            declarations.push(generate(statement).code);
                            break; // Only add the statement once even if multiple declarators
                        }
                    }
                }
            }
            programPath.skip();
        }
    });
}
/**
 * Extract props metadata from a function's parameters (for internal components in AssetPanel)
 */
function extractInternalComponentProps(params) {
    if (params.length === 0)
        return undefined;
    const firstParam = params[0];
    const props = {};
    // Handle destructured object pattern: ({ number, icon }: Props)
    if (t.isObjectPattern(firstParam)) {
        for (const prop of firstParam.properties) {
            if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                const propName = prop.key.name;
                let propType = 'any';
                let required = true;
                // Check if prop has a default value (makes it optional)
                if (t.isAssignmentPattern(prop.value)) {
                    required = false;
                }
                props[propName] = { type: propType, required };
            }
        }
        // Try to extract types from the type annotation if available
        if (firstParam.typeAnnotation && t.isTSTypeAnnotation(firstParam.typeAnnotation)) {
            const typeAnnotation = firstParam.typeAnnotation.typeAnnotation;
            // Handle inline object type: { number: number, icon: string }
            if (t.isTSTypeLiteral(typeAnnotation)) {
                for (const member of typeAnnotation.members) {
                    if (t.isTSPropertySignature(member) && t.isIdentifier(member.key)) {
                        const propName = member.key.name;
                        const isOptional = member.optional || false;
                        let propType = 'any';
                        if (member.typeAnnotation && t.isTSTypeAnnotation(member.typeAnnotation)) {
                            propType = generate(member.typeAnnotation.typeAnnotation).code;
                        }
                        if (props[propName]) {
                            props[propName].type = propType;
                            if (isOptional)
                                props[propName].required = false;
                        }
                        else {
                            props[propName] = { type: propType, required: !isOptional };
                        }
                    }
                }
            }
        }
    }
    return Object.keys(props).length > 0 ? props : undefined;
}
/**
 * Extract internal components (non-exported PascalCase arrow functions and function declarations)
 * These are helper components defined in the same file that can be edited in AssetPanel
 */
function extractInternalComponents(ast, internalComponents, exportedNames, targetComponentName) {
    traverse(ast, {
        Program(programPath) {
            for (const statement of programPath.node.body) {
                // Handle: function ModuleBadge() { ... }
                if (t.isFunctionDeclaration(statement)) {
                    if (statement.id && t.isIdentifier(statement.id)) {
                        const name = statement.id.name;
                        // Only PascalCase components
                        if (!/^[A-Z]/.test(name))
                            continue;
                        // Skip the target component itself
                        if (name === targetComponentName)
                            continue;
                        // Skip exported components (they have their own snapshots)
                        if (exportedNames.has(name))
                            continue;
                        // Get line numbers from loc
                        if (statement.loc) {
                            const props = extractInternalComponentProps(statement.params);
                            internalComponents.push({
                                name,
                                startLine: statement.loc.start.line,
                                endLine: statement.loc.end.line,
                                props,
                            });
                        }
                    }
                }
                // Handle: const ModuleBadge = () => { ... }
                if (t.isVariableDeclaration(statement)) {
                    for (const declarator of statement.declarations) {
                        if (t.isIdentifier(declarator.id)) {
                            const name = declarator.id.name;
                            // Only PascalCase components
                            if (!/^[A-Z]/.test(name))
                                continue;
                            // Skip the target component itself
                            if (name === targetComponentName)
                                continue;
                            // Skip exported components
                            if (exportedNames.has(name))
                                continue;
                            // Only arrow functions or function expressions (not data constants)
                            const init = declarator.init;
                            if (!init)
                                continue;
                            if (!t.isArrowFunctionExpression(init) && !t.isFunctionExpression(init))
                                continue;
                            // Get line numbers from the variable declaration (covers full const statement)
                            if (statement.loc) {
                                const props = extractInternalComponentProps(init.params);
                                internalComponents.push({
                                    name,
                                    startLine: statement.loc.start.line,
                                    endLine: statement.loc.end.line,
                                    props,
                                });
                            }
                        }
                    }
                }
            }
            programPath.skip();
        }
    });
}
/**
 * Extract props type annotation from function parameters
 */
function extractPropsType(params) {
    if (params.length === 0)
        return null;
    const firstParam = params[0];
    // Destructured with type: ({ prop1, prop2 }: PropsType)
    if (t.isObjectPattern(firstParam) && firstParam.typeAnnotation) {
        const annotation = firstParam.typeAnnotation;
        if (t.isTSTypeAnnotation(annotation)) {
            return generate(annotation.typeAnnotation).code;
        }
    }
    // Simple identifier with type: (props: PropsType)
    if (t.isIdentifier(firstParam) && firstParam.typeAnnotation) {
        const annotation = firstParam.typeAnnotation;
        if (t.isTSTypeAnnotation(annotation)) {
            return generate(annotation.typeAnnotation).code;
        }
    }
    return null;
}
function extractFromFunction(path, variables, props, propDefaults, initialValues, variableDeclarations, hookCalls) {
    // Extract props from function parameters
    extractPropsFromParams(path.node.params, props, propDefaults);
    // Find all return statements and check for conditional pattern
    const conditionalReturns = findConditionalReturns(path);
    let returnJSX = null;
    let allJsxNodes = [];
    if (conditionalReturns && conditionalReturns.length > 1) {
        // Has conditional returns - use the last (default) return as the main returnJSX
        // but also include conditionalReturns for snapshot generation
        const defaultReturn = conditionalReturns.find(r => r.condition === null);
        returnJSX = defaultReturn?.jsx || conditionalReturns[conditionalReturns.length - 1].jsx;
        // Find variables in ALL return JSX branches
        for (const cr of conditionalReturns) {
            try {
                const ast = parse(cr.jsx, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
                traverse(ast, {
                    JSXElement(jsxPath) {
                        findVariablesInJSX(jsxPath.node, variables);
                        allJsxNodes.push(jsxPath.node);
                    },
                    JSXFragment(jsxPath) {
                        findVariablesInJSX(jsxPath.node, variables);
                        allJsxNodes.push(jsxPath.node);
                    },
                });
            }
            catch (e) {
                // Parsing failed, continue
            }
        }
    }
    else {
        // Simple single return - use existing logic
        const returnStatement = findReturnStatement(path);
        if (returnStatement) {
            returnJSX = extractJSXFromReturn(returnStatement);
            if (returnJSX) {
                findVariablesInJSX(returnStatement.argument, variables);
                allJsxNodes.push(returnStatement.argument);
            }
        }
        // Handle implicit return: const MyComponent = () => (<div>...</div>)
        else if (t.isJSXElement(path.node.body) || t.isJSXFragment(path.node.body)) {
            returnJSX = generate(path.node.body).code;
            findVariablesInJSX(path.node.body, variables);
            allJsxNodes.push(path.node.body);
        }
    }
    if (!returnJSX)
        return null;
    // Find variables that have methods called on them in JSX (e.g., table.getHeaderGroups())
    const variablesWithMethodCalls = new Set();
    for (const jsxNode of allJsxNodes) {
        const methodCalls = findVariablesWithMethodCalls(jsxNode);
        for (const v of methodCalls) {
            variablesWithMethodCalls.add(v);
        }
    }
    // Extract hook calls (categorized)
    extractHookCalls(path, hookCalls, initialValues, variablesWithMethodCalls);
    // Extract initial values and declarations from function body
    extractInitialValues(path, variables, initialValues, props, variableDeclarations);
    // Only include conditionalReturns if there are multiple branches
    if (conditionalReturns && conditionalReturns.length > 1) {
        return { returnJSX, conditionalReturns };
    }
    return { returnJSX };
}
/**
 * Find all return statements and detect conditional return pattern.
 * Returns array of ConditionalReturn if pattern detected, null otherwise.
 */
function findConditionalReturns(path) {
    const returns = [];
    path.traverse({
        ReturnStatement(returnPath) {
            const arg = returnPath.node.argument;
            if (!arg)
                return;
            // Only process JSX returns
            if (!t.isJSXElement(arg) && !t.isJSXFragment(arg) &&
                !(t.isCallExpression(arg) && isCreateElementCall(arg))) {
                return;
            }
            // IMPORTANT: Skip returns inside nested functions (arrow functions, function declarations, function expressions)
            // These are helper functions inside the component, not component-level returns
            let currentPath = returnPath.parentPath;
            while (currentPath && currentPath !== path) {
                if (t.isArrowFunctionExpression(currentPath.node) ||
                    t.isFunctionDeclaration(currentPath.node) ||
                    t.isFunctionExpression(currentPath.node)) {
                    // This return is inside a nested function, skip it
                    return;
                }
                currentPath = currentPath.parentPath;
            }
            const jsx = generate(arg).code;
            // Check if this return is inside an if statement (early return pattern)
            let condition = null;
            currentPath = returnPath.parentPath;
            while (currentPath && currentPath !== path) {
                if (t.isIfStatement(currentPath.node)) {
                    const ifNode = currentPath.node;
                    // Check if return is in the consequent (then block), not alternate (else block)
                    const consequent = ifNode.consequent;
                    const isInConsequent = t.isBlockStatement(consequent)
                        ? consequent.body.some((stmt) => containsNode(stmt, returnPath.node))
                        : consequent === returnPath.node;
                    if (isInConsequent) {
                        condition = generate(ifNode.test).code;
                        break;
                    }
                }
                currentPath = currentPath.parentPath;
            }
            returns.push({ condition, jsx, node: returnPath.node });
        },
    });
    // Only return if we found the pattern: at least one conditional + one default return
    const hasConditional = returns.some(r => r.condition !== null);
    const hasDefault = returns.some(r => r.condition === null);
    if (hasConditional && hasDefault) {
        return returns.map(r => ({ condition: r.condition, jsx: r.jsx }));
    }
    return null;
}
/**
 * Check if a node contains another node (recursive)
 */
function containsNode(parent, target) {
    if (parent === target)
        return true;
    if (t.isBlockStatement(parent)) {
        return parent.body.some((stmt) => containsNode(stmt, target));
    }
    if (t.isIfStatement(parent)) {
        return containsNode(parent.consequent, target) ||
            !!(parent.alternate && containsNode(parent.alternate, target));
    }
    if (t.isReturnStatement(parent)) {
        return parent === target;
    }
    return false;
}
/**
 * Find variables that have methods called on them in JSX.
 * e.g., table.getHeaderGroups() → returns Set containing "table"
 * These variables can't be mocked as props - they need to stay as hook calls.
 */
function findVariablesWithMethodCalls(jsxNode) {
    const result = new Set();
    if (!jsxNode)
        return result;
    traverse(t.file(t.program([t.expressionStatement(jsxNode)])), {
        CallExpression(callPath) {
            const callee = callPath.node.callee;
            // Look for pattern: identifier.method()
            // e.g., table.getHeaderGroups()
            if (t.isMemberExpression(callee)) {
                let obj = callee.object;
                // Handle chained calls like table.getRowModel().rows.map()
                while (t.isMemberExpression(obj)) {
                    obj = obj.object;
                }
                // Handle calls like table.getRowModel().rows where getRowModel() is a call
                if (t.isCallExpression(obj) && t.isMemberExpression(obj.callee)) {
                    let innerObj = obj.callee.object;
                    while (t.isMemberExpression(innerObj)) {
                        innerObj = innerObj.object;
                    }
                    if (t.isIdentifier(innerObj)) {
                        result.add(innerObj.name);
                    }
                }
                if (t.isIdentifier(obj)) {
                    result.add(obj.name);
                }
            }
        }
    }, undefined, {});
    return result;
}
/**
 * Extract and categorize all hook calls inside a component
 */
function extractHookCalls(path, hookCalls, initialValues, variablesWithMethodCalls) {
    path.traverse({
        VariableDeclarator(declPath) {
            const init = declPath.node.init;
            if (!t.isCallExpression(init))
                return;
            const callee = init.callee;
            let hookName = null;
            // Get hook name from callee
            if (t.isIdentifier(callee)) {
                hookName = callee.name;
            }
            else if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
                hookName = callee.property.name;
            }
            if (!hookName || !hookName.startsWith('use'))
                return;
            const code = generate(declPath.parentPath.node).code;
            const extractedVariables = [];
            let setterName;
            let initialValue = undefined;
            // Determine hook type and extract variables
            let type = 'custom';
            if (hookName === 'useState') {
                type = 'useState';
                // const [state, setState] = useState(initial)
                if (t.isArrayPattern(declPath.node.id)) {
                    const elements = declPath.node.id.elements;
                    if (elements[0] && t.isIdentifier(elements[0])) {
                        extractedVariables.push(elements[0].name);
                        initialValue = evaluateInitialValue(init.arguments[0]);
                        initialValues[elements[0].name] = initialValue;
                    }
                    if (elements[1] && t.isIdentifier(elements[1])) {
                        setterName = elements[1].name;
                    }
                }
            }
            else if (hookName === 'useContext') {
                type = 'useContext';
                // const { user, theme } = useContext(Context) OR const ctx = useContext(Context)
                if (t.isObjectPattern(declPath.node.id)) {
                    for (const prop of declPath.node.id.properties) {
                        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                            extractedVariables.push(prop.key.name);
                            initialValues[prop.key.name] = undefined;
                        }
                    }
                }
                else if (t.isIdentifier(declPath.node.id)) {
                    extractedVariables.push(declPath.node.id.name);
                    initialValues[declPath.node.id.name] = undefined;
                }
            }
            else if (hookName === 'useMemo') {
                type = 'useMemo';
                if (t.isIdentifier(declPath.node.id)) {
                    extractedVariables.push(declPath.node.id.name);
                }
            }
            else if (hookName === 'useCallback') {
                type = 'useCallback';
                if (t.isIdentifier(declPath.node.id)) {
                    extractedVariables.push(declPath.node.id.name);
                }
            }
            else if (hookName === 'useRef') {
                type = 'useRef';
                if (t.isIdentifier(declPath.node.id)) {
                    extractedVariables.push(declPath.node.id.name);
                }
            }
            else {
                // Custom hook: const { data, isLoading } = useQuery() OR const isMobile = useIsMobile()
                if (t.isObjectPattern(declPath.node.id)) {
                    for (const prop of declPath.node.id.properties) {
                        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                            extractedVariables.push(prop.key.name);
                            initialValues[prop.key.name] = undefined;
                        }
                        else if (t.isRestElement(prop) && t.isIdentifier(prop.argument)) {
                            extractedVariables.push(prop.argument.name);
                            initialValues[prop.argument.name] = {};
                        }
                    }
                }
                else if (t.isIdentifier(declPath.node.id)) {
                    extractedVariables.push(declPath.node.id.name);
                    initialValues[declPath.node.id.name] = undefined;
                }
            }
            // Check if any extracted variable has method calls in JSX
            // If so, this hook can't be converted to props - it must stay in the snapshot
            const hasMethodCalls = extractedVariables.some(v => variablesWithMethodCalls.has(v));
            hookCalls.push({
                type,
                code,
                extractedVariables,
                setterName,
                initialValue,
                hookName,
                keepInSnapshot: hasMethodCalls,
            });
        },
        // Handle useEffect/useLayoutEffect (no variable assignment)
        ExpressionStatement(stmtPath) {
            const expr = stmtPath.node.expression;
            if (!t.isCallExpression(expr))
                return;
            const callee = expr.callee;
            let hookName = null;
            if (t.isIdentifier(callee)) {
                hookName = callee.name;
            }
            if (hookName === 'useEffect') {
                hookCalls.push({
                    type: 'useEffect',
                    code: generate(stmtPath.node).code,
                    extractedVariables: [],
                    hookName,
                });
            }
            else if (hookName === 'useLayoutEffect') {
                hookCalls.push({
                    type: 'useLayoutEffect',
                    code: generate(stmtPath.node).code,
                    extractedVariables: [],
                    hookName,
                });
            }
        },
    });
}
function findReturnStatement(path) {
    let returnStmt = null;
    path.traverse({
        ReturnStatement(returnPath) {
            const arg = returnPath.node.argument;
            // Accept JSX or createElement calls
            if (!returnStmt) {
                if (t.isJSXElement(arg) || t.isJSXFragment(arg) ||
                    (t.isCallExpression(arg) && isCreateElementCall(arg))) {
                    // IMPORTANT: Skip returns inside nested functions (arrow functions, function declarations, function expressions)
                    // These are helper functions inside the component, not component-level returns
                    let currentPath = returnPath.parentPath;
                    while (currentPath && currentPath !== path) {
                        if (t.isArrowFunctionExpression(currentPath.node) ||
                            t.isFunctionDeclaration(currentPath.node) ||
                            t.isFunctionExpression(currentPath.node)) {
                            // This return is inside a nested function, skip it
                            return;
                        }
                        currentPath = currentPath.parentPath;
                    }
                    returnStmt = returnPath.node;
                }
            }
        },
    });
    return returnStmt;
}
function extractJSXFromReturn(returnStatement) {
    if (!returnStatement.argument) {
        return null;
    }
    // Handle parenthesized expressions: return (<div>...</div>)
    let jsxNode = returnStatement.argument;
    if (t.isParenthesizedExpression(jsxNode)) {
        jsxNode = jsxNode.expression;
    }
    if (t.isJSXElement(jsxNode) || t.isJSXFragment(jsxNode)) {
        return generate(jsxNode).code;
    }
    // Handle createElement calls: return createElement('div', props, children)
    if (t.isCallExpression(jsxNode)) {
        if (isCreateElementCall(jsxNode)) {
            const jsx = convertCreateElementToJSX(jsxNode);
            return jsx;
        }
    }
    return null;
}
/**
 * Check if a call expression is createElement or React.createElement
 */
function isCreateElementCall(node) {
    const callee = node.callee;
    // React.createElement
    if (t.isMemberExpression(callee) &&
        t.isIdentifier(callee.object, { name: 'React' }) &&
        t.isIdentifier(callee.property, { name: 'createElement' })) {
        return true;
    }
    // createElement (direct import)
    if (t.isIdentifier(callee, { name: 'createElement' })) {
        return true;
    }
    return false;
}
/**
 * Convert createElement(tag, props, children) to JSX string
 */
function convertCreateElementToJSX(node) {
    const args = node.arguments;
    if (args.length === 0)
        return null;
    // First argument is the tag (string literal or expression)
    const tagArg = args[0];
    let tag = 'div';
    if (t.isStringLiteral(tagArg)) {
        tag = tagArg.value;
    }
    else if (t.isIdentifier(tagArg)) {
        // Check if it's a known component (starts with uppercase)
        // If not, it's a variable like 'Comp' that we can't resolve - use default
        const name = tagArg.name;
        if (/^[A-Z]/.test(name)) {
            tag = name; // Component name
        }
        else {
            // Variable like 'Comp' - we can't determine the value, use default
            tag = 'div';
        }
    }
    else if (t.isLogicalExpression(tagArg) && tagArg.operator === '??') {
        // Handle `as ?? 'span'` - use the fallback value (right side)
        if (t.isStringLiteral(tagArg.right)) {
            tag = tagArg.right.value;
        }
        else {
            tag = 'div'; // Default fallback
        }
    }
    else if (t.isConditionalExpression(tagArg)) {
        // Handle `condition ? 'div' : 'span'` - use the consequent (first option)
        if (t.isStringLiteral(tagArg.consequent)) {
            tag = tagArg.consequent.value;
        }
        else if (t.isStringLiteral(tagArg.alternate)) {
            tag = tagArg.alternate.value;
        }
        else {
            tag = 'div';
        }
    }
    else {
        // Other complex expressions - default to div
        tag = 'div';
    }
    // Second argument is props (optional)
    const propsArg = args[1];
    let propsStr = '';
    if (propsArg && !t.isNullLiteral(propsArg)) {
        // For now, we'll skip props since they're complex to convert
        // The component will use its default props
        propsStr = '';
    }
    // Third argument is children (optional)
    const childrenArg = args[2];
    let childrenStr = '';
    if (childrenArg) {
        if (t.isStringLiteral(childrenArg)) {
            childrenStr = childrenArg.value;
        }
        else if (t.isMemberExpression(childrenArg)) {
            // props.children - treat as expression
            childrenStr = `{${generate(childrenArg).code}}`;
        }
        else {
            childrenStr = `{${generate(childrenArg).code}}`;
        }
    }
    // Generate JSX
    if (childrenStr) {
        return `<${tag}${propsStr}>${childrenStr}</${tag}>`;
    }
    else {
        return `<${tag}${propsStr} />`;
    }
}
function findVariablesInJSX(node, variables) {
    const builtins = ['undefined', 'null', 'true', 'false', 'React', 'Fragment'];
    // Recursively find identifiers in an expression, tracking parent for context
    function findIdentifiersInExpression(expr, parent = null) {
        if (!expr)
            return;
        if (t.isIdentifier(expr)) {
            // Skip property names in non-computed member expressions (e.g., 'map' in data.map)
            if (t.isMemberExpression(parent) && parent.property === expr && !parent.computed) {
                return;
            }
            // Skip object property keys (e.g., 'boxShadow' in { boxShadow: "..." })
            if (t.isObjectProperty(parent) && parent.key === expr && !parent.computed) {
                return;
            }
            if (!builtins.includes(expr.name)) {
                variables.add(expr.name);
            }
        }
        else if (t.isMemberExpression(expr)) {
            findIdentifiersInExpression(expr.object, expr);
            if (expr.computed) {
                findIdentifiersInExpression(expr.property, expr);
            }
        }
        else if (t.isCallExpression(expr)) {
            findIdentifiersInExpression(expr.callee, expr);
            for (const arg of expr.arguments) {
                findIdentifiersInExpression(arg, expr);
            }
        }
        else if (t.isLogicalExpression(expr) || t.isBinaryExpression(expr)) {
            findIdentifiersInExpression(expr.left, expr);
            findIdentifiersInExpression(expr.right, expr);
        }
        else if (t.isConditionalExpression(expr)) {
            findIdentifiersInExpression(expr.test, expr);
            findIdentifiersInExpression(expr.consequent, expr);
            findIdentifiersInExpression(expr.alternate, expr);
        }
        else if (t.isUnaryExpression(expr)) {
            findIdentifiersInExpression(expr.argument, expr);
        }
        else if (t.isArrayExpression(expr)) {
            for (const elem of expr.elements) {
                findIdentifiersInExpression(elem, expr);
            }
        }
        else if (t.isObjectExpression(expr)) {
            for (const prop of expr.properties) {
                if (t.isObjectProperty(prop)) {
                    if (prop.computed) {
                        findIdentifiersInExpression(prop.key, prop);
                    }
                    findIdentifiersInExpression(prop.value, prop);
                }
                else if (t.isSpreadElement(prop)) {
                    findIdentifiersInExpression(prop.argument, prop);
                }
            }
        }
        else if (t.isArrowFunctionExpression(expr) || t.isFunctionExpression(expr)) {
            // For render callbacks (like .map() that return JSX), we need to find variables
            // used inside them, since they're part of the component's render output
            const body = expr.body;
            if (t.isJSXElement(body) || t.isJSXFragment(body)) {
                // Arrow with implicit JSX return: (item) => <div>...</div>
                findVariablesInJSXNode(body);
            }
            else if (t.isBlockStatement(body)) {
                // Arrow with block body: (item) => { return <div>...</div> }
                // Find return statements and recurse into their JSX
                for (const stmt of body.body) {
                    if (t.isReturnStatement(stmt) && stmt.argument) {
                        if (t.isJSXElement(stmt.argument) || t.isJSXFragment(stmt.argument)) {
                            findVariablesInJSXNode(stmt.argument);
                        }
                        else if (t.isConditionalExpression(stmt.argument)) {
                            // Handle: return condition ? <A/> : <B/>
                            findIdentifiersInExpression(stmt.argument, stmt);
                        }
                    }
                }
            }
            else if (t.isParenthesizedExpression(body)) {
                // Arrow with parenthesized body: (item) => (<div>...</div>)
                findIdentifiersInExpression(body.expression, body);
            }
            else {
                // For other expressions (like conditionals), recurse
                findIdentifiersInExpression(body, expr);
            }
        }
        else if (t.isTemplateLiteral(expr)) {
            for (const expression of expr.expressions) {
                findIdentifiersInExpression(expression, expr);
            }
        }
        else if (t.isSpreadElement(expr)) {
            findIdentifiersInExpression(expr.argument, expr);
        }
        else if (t.isJSXElement(expr) || t.isJSXFragment(expr)) {
            // Recurse into JSX
            findVariablesInJSXNode(expr);
        }
    }
    // Recursively walk JSX tree
    function findVariablesInJSXNode(jsxNode) {
        if (!jsxNode)
            return;
        if (t.isJSXElement(jsxNode)) {
            // Handle component names (uppercase = might be a variable)
            const openingElement = jsxNode.openingElement;
            if (openingElement && t.isJSXIdentifier(openingElement.name)) {
                const name = openingElement.name.name;
                if (/^[A-Z]/.test(name)) {
                    variables.add(name);
                }
            }
            // Handle attributes
            for (const attr of openingElement.attributes || []) {
                if (t.isJSXSpreadAttribute(attr)) {
                    findIdentifiersInExpression(attr.argument, attr);
                }
                else if (t.isJSXAttribute(attr) && attr.value) {
                    if (t.isJSXExpressionContainer(attr.value)) {
                        findIdentifiersInExpression(attr.value.expression, attr.value);
                    }
                }
            }
            // Handle children
            for (const child of jsxNode.children || []) {
                findVariablesInJSXNode(child);
            }
        }
        else if (t.isJSXFragment(jsxNode)) {
            for (const child of jsxNode.children || []) {
                findVariablesInJSXNode(child);
            }
        }
        else if (t.isJSXExpressionContainer(jsxNode)) {
            // This is the key: {hasPropsReference && ...} or {items.map(...)}
            findIdentifiersInExpression(jsxNode.expression, jsxNode);
        }
        else if (t.isJSXText(jsxNode)) {
            // Plain text, nothing to extract
        }
    }
    // Handle createElement calls
    if (t.isCallExpression(node) && isCreateElementCall(node)) {
        // Extract variables from all arguments
        for (const arg of node.arguments) {
            findIdentifiersInExpression(arg, node);
        }
        return;
    }
    // Start recursive walk for JSX
    findVariablesInJSXNode(node);
}
function extractPropsFromParams(params, props, propDefaults) {
    for (const param of params) {
        if (t.isIdentifier(param)) {
            // Simple param: function Comp(props)
            props.add(param.name);
        }
        else if (t.isObjectPattern(param)) {
            // Destructured: function Comp({ prop1, prop2 = defaultValue })
            for (const prop of param.properties) {
                if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                    const propName = prop.key.name;
                    props.add(propName);
                    // Check for default value: { columns = tasksColumns } or { data = [...] }
                    // In AST this is an AssignmentPattern as the value
                    if (t.isAssignmentPattern(prop.value)) {
                        // Generate the default value as code
                        const defaultCode = generate(prop.value.right).code;
                        propDefaults[propName] = defaultCode;
                    }
                }
                else if (t.isRestElement(prop)) {
                    // Rest element: function Comp({ prop1, ...props })
                    // Include it so the generated snapshot can use {...props}
                    if (t.isIdentifier(prop.argument)) {
                        props.add(prop.argument.name);
                    }
                }
            }
        }
    }
}
function extractInitialValues(path, variables, initialValues, props, variableDeclarations) {
    // Collect declarations that are DIRECT children of the component's block statement
    // We don't want to include variables declared inside nested arrow functions, loops, etc.
    const allDeclarations = [];
    const allFunctionDecls = [];
    // Get the component's body (BlockStatement)
    const body = path.node.body;
    if (!t.isBlockStatement(body)) {
        // Implicit return arrow function - no variable declarations to extract
        return;
    }
    // Only iterate over direct statements in the function body
    for (const statement of body.body) {
        if (t.isVariableDeclaration(statement)) {
            const code = generate(statement).code;
            const varNames = [];
            const initNodes = [];
            for (const declarator of statement.declarations) {
                if (t.isIdentifier(declarator.id)) {
                    varNames.push(declarator.id.name);
                    if (declarator.init) {
                        initNodes.push(declarator.init);
                    }
                }
                else if (t.isArrayPattern(declarator.id)) {
                    for (const element of declarator.id.elements) {
                        if (t.isIdentifier(element)) {
                            varNames.push(element.name);
                        }
                    }
                    if (declarator.init) {
                        initNodes.push(declarator.init);
                    }
                }
                else if (t.isObjectPattern(declarator.id)) {
                    for (const prop of declarator.id.properties) {
                        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                            varNames.push(prop.key.name);
                        }
                    }
                    if (declarator.init) {
                        initNodes.push(declarator.init);
                    }
                }
            }
            allDeclarations.push({ code, varNames, initNodes });
        }
        else if (t.isFunctionDeclaration(statement)) {
            if (statement.id && t.isIdentifier(statement.id)) {
                const name = statement.id.name;
                const code = generate(statement).code;
                allFunctionDecls.push({ code, name });
            }
        }
    }
    // Now do multiple passes to find all transitive dependencies
    // Keep looping until no new variables are added
    const neededDeclarations = new Set();
    const neededFunctionDecls = new Set();
    let changed = true;
    while (changed) {
        changed = false;
        for (const decl of allDeclarations) {
            // Skip if already marked as needed
            if (neededDeclarations.has(decl.code))
                continue;
            // Check if any declared variable is in our variables set
            const hasRelevantVariable = decl.varNames.some(varName => variables.has(varName) && !props.has(varName));
            if (hasRelevantVariable) {
                neededDeclarations.add(decl.code);
                changed = true;
                // Scan initializers for new variable dependencies
                for (const initNode of decl.initNodes) {
                    traverse(t.file(t.program([t.expressionStatement(initNode)])), {
                        Identifier(idPath) {
                            // Skip property names in non-computed member expressions
                            if (t.isMemberExpression(idPath.parent) &&
                                idPath.parent.property === idPath.node &&
                                !idPath.parent.computed) {
                                return;
                            }
                            // Skip object property keys
                            if (t.isObjectProperty(idPath.parent) && idPath.parent.key === idPath.node && !idPath.parent.computed) {
                                return;
                            }
                            const name = idPath.node.name;
                            // Skip common built-ins
                            if (!['undefined', 'null', 'true', 'false', 'React', 'Fragment'].includes(name)) {
                                if (!variables.has(name)) {
                                    variables.add(name);
                                    changed = true;
                                }
                            }
                        },
                    }, undefined, {});
                }
            }
        }
        // Also check function declarations
        for (const funcDecl of allFunctionDecls) {
            if (neededFunctionDecls.has(funcDecl.code))
                continue;
            if (variables.has(funcDecl.name)) {
                neededFunctionDecls.add(funcDecl.code);
                initialValues[funcDecl.name] = () => { };
                changed = true;
            }
        }
    }
    // Add declarations in their original source order (not discovery order)
    for (const decl of allDeclarations) {
        if (neededDeclarations.has(decl.code)) {
            variableDeclarations.push(decl.code);
        }
    }
    for (const funcDecl of allFunctionDecls) {
        if (neededFunctionDecls.has(funcDecl.code)) {
            variableDeclarations.push(funcDecl.code);
        }
    }
    // Now extract initial values from declarations
    path.traverse({
        VariableDeclarator(declPath) {
            const id = declPath.node.id;
            const init = declPath.node.init;
            // Handle: const [state, setState] = useState(initialValue)
            if (t.isArrayPattern(id) && t.isCallExpression(init)) {
                if (t.isIdentifier(init.callee) && init.callee.name === 'useState') {
                    const stateVar = id.elements[0];
                    if (t.isIdentifier(stateVar) && variables.has(stateVar.name)) {
                        const initialValue = evaluateInitialValue(init.arguments[0]);
                        initialValues[stateVar.name] = initialValue;
                    }
                }
            }
            // Handle: const { data, isLoading } = useQuery()
            if (t.isObjectPattern(id)) {
                for (const prop of id.properties) {
                    if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                        const varName = prop.key.name;
                        if (variables.has(varName) && !props.has(varName)) {
                            // For destructured values from hooks, use undefined as default
                            // User can set proper values later
                            initialValues[varName] = undefined;
                        }
                    }
                }
            }
            // Handle: const data = [...] or const handleClick = () => {...}
            if (t.isIdentifier(id) && variables.has(id.name) && !props.has(id.name)) {
                const value = evaluateInitialValue(init);
                initialValues[id.name] = value;
            }
        },
    });
}
/**
 * Extract module-level constants (const declarations at top level)
 */
function extractModuleLevelConstants(ast, moduleConstants, moduleConstantDeclarations) {
    // First, collect all exported const names so we can skip them
    // (exported components should have their own snapshots)
    const exportedConstNames = new Set();
    traverse(ast, {
        ExportNamedDeclaration(path) {
            const decl = path.node.declaration;
            if (t.isVariableDeclaration(decl)) {
                for (const declarator of decl.declarations) {
                    if (t.isIdentifier(declarator.id)) {
                        exportedConstNames.add(declarator.id.name);
                    }
                }
            }
        }
    });
    traverse(ast, {
        Program(programPath) {
            // Only process top-level declarations
            for (const statement of programPath.node.body) {
                // Only handle VariableDeclaration at module level
                if (t.isVariableDeclaration(statement) && statement.kind === 'const') {
                    for (const declarator of statement.declarations) {
                        if (t.isIdentifier(declarator.id)) {
                            const name = declarator.id.name;
                            const init = declarator.init;
                            if (!init)
                                continue;
                            // Skip ALL React components (function components, forwardRef, etc.)
                            // These are handled by extractModuleFunctionDeclarations
                            // Including them here would cause "name is defined multiple times" errors
                            if (t.isArrowFunctionExpression(init) ||
                                t.isFunctionExpression(init) ||
                                (t.isCallExpression(init) && isForwardRefCall(init))) {
                                // Skip all PascalCase arrow functions - they're handled by moduleFunctionDeclarations
                                if (/^[A-Z]/.test(name)) {
                                    continue;
                                }
                            }
                            // Add the declaration code (for snapshot generation)
                            moduleConstantDeclarations.push(generate(statement).code);
                            // Try to evaluate the value (for mock value generation)
                            const value = evaluateModuleConstant(init);
                            if (value !== undefined) {
                                moduleConstants[name] = value;
                            }
                        }
                    }
                }
            }
            // Don't traverse deeper - we only want module level
            programPath.skip();
        }
    });
}
/**
 * Evaluate module-level constant values (supports JSX elements in objects)
 */
function evaluateModuleConstant(node) {
    if (!node)
        return undefined;
    try {
        // Literal values
        if (t.isStringLiteral(node))
            return node.value;
        if (t.isNumericLiteral(node))
            return node.value;
        if (t.isBooleanLiteral(node))
            return node.value;
        if (t.isNullLiteral(node))
            return null;
        // Array: [1, 2, 3] or [<svg/>, <svg/>]
        if (t.isArrayExpression(node)) {
            return node.elements.map((el) => evaluateModuleConstant(el));
        }
        // Object: { github: <svg/>, database: <svg/> }
        if (t.isObjectExpression(node)) {
            const obj = {};
            for (const prop of node.properties) {
                if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                    obj[prop.key.name] = evaluateModuleConstant(prop.value);
                }
            }
            return obj;
        }
        // JSX Elements: <svg>...</svg> - convert to JSX string
        if (t.isJSXElement(node) || t.isJSXFragment(node)) {
            return generate(node).code;
        }
        // JSX in parentheses: (<svg>...</svg>)
        if (t.isParenthesizedExpression(node)) {
            return evaluateModuleConstant(node.expression);
        }
        // Arrow function or function expression
        if (t.isArrowFunctionExpression(node) || t.isFunctionExpression(node)) {
            // Store the function as a string for now
            return generate(node).code;
        }
        // For complex expressions, return undefined
        return undefined;
    }
    catch (error) {
        return undefined;
    }
}
function evaluateInitialValue(node) {
    if (!node)
        return undefined;
    try {
        // Literal values
        if (t.isStringLiteral(node))
            return node.value;
        if (t.isNumericLiteral(node))
            return node.value;
        if (t.isBooleanLiteral(node))
            return node.value;
        if (t.isNullLiteral(node))
            return null;
        // Array: [1, 2, 3]
        if (t.isArrayExpression(node)) {
            return node.elements.map((el) => evaluateInitialValue(el));
        }
        // Object: { id: 1, name: 'test' }
        if (t.isObjectExpression(node)) {
            const obj = {};
            for (const prop of node.properties) {
                if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                    obj[prop.key.name] = evaluateInitialValue(prop.value);
                }
            }
            return obj;
        }
        // Arrow function or function expression
        if (t.isArrowFunctionExpression(node) || t.isFunctionExpression(node)) {
            return () => { };
        }
        // For complex expressions, return undefined
        return undefined;
    }
    catch (error) {
        return undefined;
    }
}
