import { Project, SyntaxKind, Node } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';
import { importantHtmlProps } from '@lunagraph/codegen';
/**
 * Convert a filename or export name to a valid PascalCase identifier
 * e.g., "improve-dropdown" -> "ImproveDropdown"
 * e.g., "my_component" -> "MyComponent"
 * e.g., "Component.styles" -> "ComponentStyles"
 */
function toValidIdentifier(name) {
    return name
        .split(/[-_.]/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
}
/**
 * Scans a directory for React components and extracts their metadata
 */
export class ComponentScanner {
    rootDir;
    project;
    componentIndex = {};
    constructor(rootDir) {
        this.rootDir = rootDir;
        this.project = new Project({
            tsConfigFilePath: path.join(rootDir, 'tsconfig.json'),
            skipAddingFilesFromTsConfig: true,
        });
    }
    /**
     * Scan a single glob pattern for components.
     */
    async scan(pattern = 'app/components/**/*.{ts,tsx}') {
        return this.scanMultiple([pattern]);
    }
    /**
     * Scan multiple glob patterns for components.
     */
    async scanMultiple(patterns) {
        let totalFiles = 0;
        // Scan each pattern
        for (const pattern of patterns) {
            // Extract base directory from pattern to check if it exists
            const baseDir = pattern.split('*')[0].replace(/\/$/, '');
            const fullBaseDir = path.join(this.rootDir, baseDir);
            // Skip patterns where the base directory doesn't exist
            if (baseDir && !fs.existsSync(fullBaseDir)) {
                continue;
            }
            console.log(`Scanning: ${pattern}`);
            // Add source files
            const sourceFiles = this.project.addSourceFilesAtPaths(pattern);
            totalFiles += sourceFiles.length;
            for (const sourceFile of sourceFiles) {
                this.scanFile(sourceFile.getFilePath());
            }
        }
        console.log(`Found ${totalFiles} files total`);
        return this.componentIndex;
    }
    /**
     * Check if a node is a React component
     */
    isReactComponent(node) {
        // Check for function components
        if (Node.isFunctionDeclaration(node) || Node.isArrowFunction(node) || Node.isFunctionExpression(node)) {
            const returnType = node.getReturnType();
            const returnTypeText = returnType.getText();
            // Check if it returns JSX or React elements
            if (returnTypeText.includes('JSX.Element') ||
                returnTypeText.includes('React.ReactElement') ||
                returnTypeText.includes('ReactElement') ||
                returnTypeText.includes('React.ReactNode') ||
                returnTypeText.includes('ReactNode')) {
                return true;
            }
            // Check if function body contains JSX
            if (Node.isFunctionDeclaration(node) || Node.isArrowFunction(node)) {
                const body = node.getBody();
                if (body) {
                    const jsxElements = body.getDescendantsOfKind(SyntaxKind.JsxElement);
                    const jsxSelfClosing = body.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
                    if (jsxElements.length > 0 || jsxSelfClosing.length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    /**
     * Extract props from a type node (for forwardRef type parameters)
     */
    extractPropsFromTypeNode(typeNode) {
        const props = {};
        // Handle type reference (e.g., ButtonProps, TextProps)
        if (Node.isTypeReference(typeNode)) {
            const typeName = typeNode.getTypeName();
            if (Node.isIdentifier(typeName)) {
                // Get the type declaration
                const type = typeNode.getType();
                const symbol = type.getSymbol();
                const declarations = symbol?.getDeclarations();
                if (declarations && declarations.length > 0) {
                    const declaration = declarations[0];
                    // Handle interface declaration
                    if (Node.isInterfaceDeclaration(declaration)) {
                        const members = declaration.getMembers();
                        for (const member of members) {
                            if (Node.isPropertySignature(member)) {
                                const name = member.getName();
                                const type = member.getType().getText();
                                props[name] = {
                                    type,
                                    required: !member.hasQuestionToken(),
                                };
                            }
                        }
                    }
                    // Handle type alias (e.g., type TextProps = PropsWithChildren<{...}>)
                    else if (Node.isTypeAliasDeclaration(declaration)) {
                        const aliasTypeNode = declaration.getTypeNode();
                        // Check if it's PropsWithChildren or similar utility type
                        if (aliasTypeNode && Node.isTypeReference(aliasTypeNode)) {
                            const utilityTypeName = aliasTypeNode.getTypeName();
                            if (Node.isIdentifier(utilityTypeName)) {
                                const utilityName = utilityTypeName.getText();
                                // Handle PropsWithChildren<{...}>
                                if (utilityName === 'PropsWithChildren') {
                                    props['children'] = {
                                        type: 'React.ReactNode',
                                        required: false,
                                    };
                                    // Extract props from the type argument
                                    const typeArgs = aliasTypeNode.getTypeArguments();
                                    if (typeArgs.length > 0) {
                                        const innerType = typeArgs[0];
                                        if (Node.isTypeLiteral(innerType)) {
                                            const members = innerType.getMembers();
                                            for (const member of members) {
                                                if (Node.isPropertySignature(member)) {
                                                    const name = member.getName();
                                                    const type = member.getType().getText();
                                                    props[name] = {
                                                        type,
                                                        required: !member.hasQuestionToken(),
                                                    };
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        // Direct type literal
                        else if (aliasTypeNode && Node.isTypeLiteral(aliasTypeNode)) {
                            const members = aliasTypeNode.getMembers();
                            for (const member of members) {
                                if (Node.isPropertySignature(member)) {
                                    const name = member.getName();
                                    const type = member.getType().getText();
                                    props[name] = {
                                        type,
                                        required: !member.hasQuestionToken(),
                                    };
                                }
                            }
                        }
                    }
                }
                // Also check for extended types (interface extends X)
                const properties = type.getProperties();
                for (const prop of properties) {
                    const name = prop.getName();
                    if (!props[name]) { // Don't overwrite already extracted props
                        const propType = prop.getTypeAtLocation(typeNode);
                        props[name] = {
                            type: propType.getText(),
                            required: !prop.isOptional(),
                        };
                    }
                }
            }
        }
        return Object.keys(props).length > 0 ? props : undefined;
    }
    /**
     * Detect HTML element name from type text (e.g., "button" from ComponentProps<"button">)
     */
    detectHTMLElement(typeText) {
        const match = typeText.match(/ComponentProps(?:WithoutRef|WithRef)?<["'](\w+)["']>/);
        return match ? match[1] : null;
    }
    /**
     * Get base HTML element props by creating a temporary type
     */
    getBaseHTMLElementProps(elementName) {
        try {
            // Create a temporary source file with the element type
            const tempFile = this.project.createSourceFile('__temp__.tsx', `import React from 'react'; type Props = React.ComponentProps<'${elementName}'>`, { overwrite: true });
            const typeAlias = tempFile.getTypeAliases()[0];
            if (typeAlias) {
                const type = typeAlias.getType();
                const props = type.getProperties();
                const propNames = new Set(props.map(p => p.getName()));
                // Clean up
                this.project.removeSourceFile(tempFile);
                return propNames;
            }
            this.project.removeSourceFile(tempFile);
        }
        catch (error) {
            // If we can't resolve it, return empty set
        }
        return new Set();
    }
    /**
     * Extract props from inline type literals in an intersection type
     */
    extractInlineProps(typeNode) {
        const props = {};
        // Handle intersection type: A & B & C
        if (Node.isIntersectionTypeNode(typeNode)) {
            for (const typeRef of typeNode.getTypeNodes()) {
                // Extract from inline type literals only
                if (Node.isTypeLiteral(typeRef)) {
                    const members = typeRef.getMembers();
                    for (const member of members) {
                        if (Node.isPropertySignature(member)) {
                            const name = member.getName();
                            const type = member.getType().getText();
                            props[name] = {
                                type,
                                required: !member.hasQuestionToken(),
                            };
                        }
                    }
                }
            }
        }
        // Single inline type literal
        else if (Node.isTypeLiteral(typeNode)) {
            const members = typeNode.getMembers();
            for (const member of members) {
                if (Node.isPropertySignature(member)) {
                    const name = member.getName();
                    const type = member.getType().getText();
                    props[name] = {
                        type,
                        required: !member.hasQuestionToken(),
                    };
                }
            }
        }
        return Object.keys(props).length > 0 ? props : undefined;
    }
    /**
     * Extract props from a component
     */
    extractProps(node) {
        const allProps = {};
        if (Node.isFunctionDeclaration(node) || Node.isArrowFunction(node) || Node.isFunctionExpression(node)) {
            const params = node.getParameters();
            if (params.length > 0) {
                const firstParam = params[0];
                const typeNode = firstParam.getTypeNode();
                const paramType = firstParam.getType();
                // Check if this type extends HTML element props or library component props
                // Use typeNode (source annotation) not paramType (resolved type)
                const typeText = typeNode ? typeNode.getText() : '';
                const htmlElement = this.detectHTMLElement(typeText);
                // Check if it's extending a library component (ComponentProps<typeof ...>)
                const isLibraryComponent = /ComponentProps(?:WithoutRef|WithRef)?<typeof/.test(typeText);
                // If it's a library component, extract:
                // 1. Explicitly destructured props from the function signature
                // 2. Inline props from intersection types
                // 3. Component-specific props (declared in library, not inherited from HTML/React)
                // 4. style and children
                if (isLibraryComponent) {
                    const result = {};
                    // Extract explicitly destructured props from function signature
                    // e.g., function Progress({ className, value, ...props }) - extract className and value
                    const nameNode = firstParam.getNameNode();
                    if (Node.isObjectBindingPattern(nameNode)) {
                        const elements = nameNode.getElements();
                        for (const element of elements) {
                            // Skip rest elements (...props)
                            if (element.getDotDotDotToken())
                                continue;
                            const propName = element.getName();
                            // Skip className as it's standard
                            if (propName === 'className')
                                continue;
                            // Get the type for this prop from the resolved type
                            const propSymbol = paramType.getProperty(propName);
                            if (propSymbol) {
                                const propType = propSymbol.getTypeAtLocation(firstParam);
                                result[propName] = {
                                    type: propType.getText(),
                                    required: !propSymbol.isOptional(),
                                };
                            }
                        }
                    }
                    // Extract inline props if there's an intersection
                    if (typeNode && Node.isIntersectionTypeNode(typeNode)) {
                        const inlineProps = this.extractInlineProps(typeNode);
                        if (inlineProps) {
                            Object.assign(result, inlineProps);
                        }
                    }
                    // Extract component-specific props from the resolved type
                    // These are props declared in the library itself, not inherited from HTML/React types
                    const properties = paramType.getProperties();
                    for (const prop of properties) {
                        const propName = prop.getName();
                        // Skip if already extracted or is className
                        if (result[propName])
                            continue;
                        if (propName === 'className')
                            continue;
                        // Check where this prop is declared
                        const declarations = prop.getDeclarations();
                        let isLibraryProp = false;
                        for (const decl of declarations) {
                            const filePath = decl.getSourceFile().getFilePath();
                            // If NOT from React types or DOM lib, it's a library-specific prop
                            if (!filePath.includes('@types/react') &&
                                !filePath.includes('lib.dom') &&
                                !filePath.includes('node_modules/typescript/lib')) {
                                isLibraryProp = true;
                                break;
                            }
                        }
                        if (isLibraryProp) {
                            const propType = prop.getTypeAtLocation(firstParam);
                            result[propName] = {
                                type: propType.getText(),
                                required: !prop.isOptional(),
                            };
                        }
                    }
                    // Ensure style and children are included if they exist
                    const hasStyle = properties.some(p => p.getName() === 'style');
                    const hasChildren = properties.some(p => p.getName() === 'children');
                    if (hasStyle && !result['style']) {
                        result['style'] = {
                            type: 'React.CSSProperties | undefined',
                            required: false,
                        };
                    }
                    if (hasChildren && !result['children']) {
                        result['children'] = {
                            type: 'React.ReactNode',
                            required: false,
                        };
                    }
                    // Return only if we have at least style or children or custom props
                    return Object.keys(result).length > 0 ? result : undefined;
                }
                // Get all properties from the parameter type
                const properties = paramType.getProperties();
                for (const prop of properties) {
                    const name = prop.getName();
                    const propType = prop.getTypeAtLocation(typeNode || firstParam);
                    allProps[name] = {
                        type: propType.getText(),
                        required: !prop.isOptional(),
                    };
                }
                // If it's an HTML element, filter to keep only custom props + important HTML props
                if (htmlElement) {
                    // Get base HTML element props
                    const baseProps = this.getBaseHTMLElementProps(htmlElement);
                    // Use shared whitelist of important HTML props
                    const importantProps = new Set(importantHtmlProps[htmlElement] || []);
                    // Filter to keep: custom props + style + children + important HTML props
                    const filtered = {};
                    for (const [name, value] of Object.entries(allProps)) {
                        // Always keep style and children
                        if (name === 'style' || name === 'children') {
                            filtered[name] = value;
                        }
                        // Keep if it's an important HTML prop for this element
                        else if (importantProps.has(name)) {
                            filtered[name] = value;
                        }
                        // Keep if it's NOT in base HTML props (= custom prop)
                        else if (!baseProps.has(name)) {
                            filtered[name] = value;
                        }
                    }
                    return Object.keys(filtered).length > 0 ? filtered : undefined;
                }
                // Not extending HTML props or library - keep all props
                return Object.keys(allProps).length > 0 ? allProps : undefined;
            }
        }
        return undefined;
    }
    /**
     * Check if a declaration is from an external library (node_modules)
     */
    isExternalLibrary(declarationPath) {
        return declarationPath.includes('node_modules');
    }
    /**
     * Check if an export name looks like a React component (PascalCase)
     */
    looksLikeComponentName(name) {
        // Must start with uppercase letter and not be all caps (constants)
        return /^[A-Z][a-zA-Z0-9]*$/.test(name) && name !== name.toUpperCase();
    }
    /**
     * Scan a single file for exported React components
     */
    scanFile(filePath) {
        const sourceFile = this.project.getSourceFile(filePath);
        if (!sourceFile)
            return;
        const relativePath = path.relative(this.rootDir, filePath);
        // Find all exported declarations
        const exports = sourceFile.getExportedDeclarations();
        exports.forEach((declarations, exportName) => {
            for (const declaration of declarations) {
                // Get the actual source file where this declaration lives
                const declarationFile = declaration.getSourceFile();
                const declarationPath = path.relative(this.rootDir, declarationFile.getFilePath());
                // Check if this is a re-export from an external library (e.g., Radix)
                if (this.isExternalLibrary(declarationPath)) {
                    // If it looks like a component name (PascalCase), add it as a component
                    // Use the current file's path, not the library's path
                    if (this.looksLikeComponentName(exportName)) {
                        const newEntry = {
                            path: relativePath,
                            exportName,
                            props: undefined, // We can't easily extract props from library components
                        };
                        // Only add if not already in index
                        if (!this.componentIndex[exportName]) {
                            this.componentIndex[exportName] = newEntry;
                        }
                    }
                    continue; // Skip further processing for external declarations
                }
                // Use the declaration's actual file path, not the export file path
                const actualPath = declarationPath;
                // For default exports, use the file name as the component name
                const componentKey = exportName === 'default'
                    ? toValidIdentifier(path.basename(actualPath, path.extname(actualPath)))
                    : exportName;
                // Check function declarations
                if (Node.isFunctionDeclaration(declaration)) {
                    if (this.isReactComponent(declaration)) {
                        const newEntry = {
                            path: actualPath,
                            exportName,
                            props: this.extractProps(declaration),
                        };
                        // Only overwrite if new entry has props or existing doesn't exist
                        if (!this.componentIndex[componentKey] || newEntry.props) {
                            this.componentIndex[componentKey] = newEntry;
                        }
                    }
                }
                // Check variable declarations (const Component = () => {})
                if (Node.isVariableDeclaration(declaration)) {
                    const initializer = declaration.getInitializer();
                    // Handle React.forwardRef
                    if (initializer && Node.isCallExpression(initializer)) {
                        const expression = initializer.getExpression();
                        const expressionText = expression.getText();
                        // Check if it's React.forwardRef or forwardRef
                        if (expressionText === 'React.forwardRef' || expressionText === 'forwardRef') {
                            // Extract props from the type parameters of forwardRef<Ref, Props>
                            const typeArgs = initializer.getTypeArguments();
                            let propsFromForwardRef = undefined;
                            // Second type argument is the Props type
                            if (typeArgs.length >= 2) {
                                const propsTypeNode = typeArgs[1];
                                propsFromForwardRef = this.extractPropsFromTypeNode(propsTypeNode);
                            }
                            // If we couldn't get props from type args, try the function parameter
                            if (!propsFromForwardRef) {
                                const args = initializer.getArguments();
                                if (args.length > 0) {
                                    const firstArg = args[0];
                                    if (Node.isArrowFunction(firstArg) || Node.isFunctionExpression(firstArg)) {
                                        propsFromForwardRef = this.extractProps(firstArg);
                                    }
                                }
                            }
                            const newEntry = {
                                path: actualPath,
                                exportName,
                                props: propsFromForwardRef,
                            };
                            // Only overwrite if new entry has props or existing doesn't exist
                            if (!this.componentIndex[componentKey] || newEntry.props) {
                                this.componentIndex[componentKey] = newEntry;
                            }
                        }
                    }
                    // Regular arrow function or function expression
                    else if (initializer && (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))) {
                        if (this.isReactComponent(initializer)) {
                            const newEntry = {
                                path: actualPath,
                                exportName,
                                props: this.extractProps(initializer),
                            };
                            // Only overwrite if new entry has props or existing doesn't exist
                            if (!this.componentIndex[componentKey] || newEntry.props) {
                                this.componentIndex[componentKey] = newEntry;
                            }
                        }
                    }
                    // Handle re-exports from external libraries (e.g., const DropdownMenu = DropdownMenuPrimitive.Root)
                    else if (initializer && (Node.isPropertyAccessExpression(initializer) || Node.isIdentifier(initializer))) {
                        // Check if the initializer resolves to an external library type
                        const initializerType = initializer.getType();
                        const typeSymbol = initializerType.getSymbol() || initializerType.getAliasSymbol();
                        if (typeSymbol) {
                            const typeDeclarations = typeSymbol.getDeclarations();
                            const isFromExternalLibrary = typeDeclarations?.some(decl => {
                                const filePath = decl.getSourceFile().getFilePath();
                                return filePath.includes('node_modules');
                            });
                            // If it's PascalCase and from an external library, add it as a component
                            if (isFromExternalLibrary && this.looksLikeComponentName(exportName)) {
                                const newEntry = {
                                    path: actualPath,
                                    exportName,
                                    props: undefined, // We can't easily extract props from library re-exports
                                };
                                if (!this.componentIndex[componentKey]) {
                                    this.componentIndex[componentKey] = newEntry;
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    /**
     * Write the component index to a JSON file
     */
    async writeIndex(outputPath) {
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(outputPath, JSON.stringify(this.componentIndex, null, 2), 'utf-8');
    }
    /**
     * Generate the components.ts file with auto-imports
     */
    async writeComponentsFile(outputPath) {
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        // Group components by their file path, separating default and named exports
        const fileGroups = new Map();
        for (const [componentName, info] of Object.entries(this.componentIndex)) {
            const filePath = info.path;
            if (!fileGroups.has(filePath)) {
                fileGroups.set(filePath, { defaults: [], named: [] });
            }
            const group = fileGroups.get(filePath);
            if (info.exportName === 'default') {
                // Extract component name from file path (e.g., "components/MyComponent.tsx" -> "MyComponent")
                // Convert kebab-case filenames to valid PascalCase identifiers
                const fileName = path.basename(filePath, path.extname(filePath));
                const validName = toValidIdentifier(fileName);
                group.defaults.push(validName);
            }
            else {
                group.named.push(info.exportName);
            }
        }
        // Deduplicate: if a default export name matches a named export, prefer the named export
        for (const [, { defaults, named }] of fileGroups) {
            const namedSet = new Set(named);
            // Remove defaults that are already covered by named exports
            for (let i = defaults.length - 1; i >= 0; i--) {
                if (namedSet.has(defaults[i])) {
                    defaults.splice(i, 1);
                }
            }
        }
        // Generate import statements
        const imports = [];
        const componentNames = [];
        for (const [filePath, { defaults, named }] of fileGroups) {
            // Convert file path to import path (remove .tsx/.ts extension)
            const importPath = filePath.replace(/\.tsx?$/, '');
            // Create relative import from .lunagraph/ to the component file
            const absoluteComponentPath = path.join(this.rootDir, importPath);
            const relativeImport = path.relative(outputDir, absoluteComponentPath)
                .replace(/\\/g, '/'); // Convert Windows paths to forward slashes
            // Generate proper import statement based on export type
            if (defaults.length > 0 && named.length === 0) {
                // Only default export: import ComponentName from './path'
                const defaultName = defaults[0];
                imports.push(`import ${defaultName} from './${relativeImport}'`);
                componentNames.push(defaultName);
            }
            else if (defaults.length === 0 && named.length > 0) {
                // Only named exports: import { Name1, Name2 } from './path'
                imports.push(`import { ${named.join(', ')} } from './${relativeImport}'`);
                componentNames.push(...named);
            }
            else if (defaults.length > 0 && named.length > 0) {
                // Both: import DefaultName, { Named1, Named2 } from './path'
                const defaultName = defaults[0];
                imports.push(`import ${defaultName}, { ${named.join(', ')} } from './${relativeImport}'`);
                componentNames.push(defaultName, ...named);
            }
        }
        // Generate the file content
        const content = `// Auto-generated by @lunagraph/cli - do not edit manually
// Run 'npx lunagraph scan' to regenerate this file

${imports.join('\n')}
import componentIndexData from './ComponentIndex.json'

// Export all components
export { ${componentNames.join(', ')} }

// Export as components object
export const components = {
  ${componentNames.join(',\n  ')}
}

// Export component index metadata
export const componentIndex = componentIndexData
`;
        fs.writeFileSync(outputPath, content, 'utf-8');
    }
}
