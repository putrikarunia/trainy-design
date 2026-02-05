import { Project, SyntaxKind, Node } from 'ts-morph';
import * as path from 'path';
/**
 * Extract TypeScript types from a component file using ts-morph
 * This gives us proper type information for:
 * - Original props (including union types like variant: "default" | "destructive")
 * - useState hooks (useState<number | null>)
 * - Internal constants (const products: Product[] = ...)
 */
export function extractTypesFromFile(filePath, rootDir) {
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
        // Extract props from function parameters
        result.props = extractPropsFromFunction(componentFunction);
        // Extract useState calls
        result.stateVariables = extractUseStateCalls(componentFunction);
        // Extract internal constants
        result.internalConstants = extractInternalConstants(componentFunction);
        return result;
    }
    catch (error) {
        console.error('Failed to extract types:', error);
        return null;
    }
}
/**
 * Find the main component function in the source file
 */
function findComponentFunction(sourceFile) {
    // Check for default export function
    const defaultExport = sourceFile.getDefaultExportSymbol();
    if (defaultExport) {
        const declarations = defaultExport.getDeclarations();
        for (const decl of declarations) {
            if (Node.isFunctionDeclaration(decl)) {
                return decl;
            }
            // Handle: export default function Component() {}
            if (Node.isExportAssignment(decl)) {
                const expr = decl.getExpression();
                if (Node.isIdentifier(expr)) {
                    // Find the function with this name
                    const funcDecl = sourceFile.getFunction(expr.getText());
                    if (funcDecl)
                        return funcDecl;
                }
            }
        }
    }
    // Check for named function declarations
    const functions = sourceFile.getFunctions();
    for (const func of functions) {
        // Check if it returns JSX
        const body = func.getBody();
        if (body) {
            const jsxElements = body.getDescendantsOfKind(SyntaxKind.JsxElement);
            const jsxSelfClosing = body.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
            if (jsxElements.length > 0 || jsxSelfClosing.length > 0) {
                return func;
            }
        }
    }
    // Check for arrow function components
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
/**
 * Extract props from function parameters with their types
 */
function extractPropsFromFunction(func) {
    const props = [];
    const params = func.getParameters();
    if (params.length === 0)
        return props;
    const firstParam = params[0];
    // Handle destructured props: function Component({ variant, size }: Props)
    if (Node.isObjectBindingPattern(firstParam.getNameNode())) {
        const bindingPattern = firstParam.getNameNode();
        const elements = bindingPattern.getElements();
        for (const element of elements) {
            // Skip rest elements (...props)
            if (element.getDotDotDotToken()) {
                continue;
            }
            const name = element.getName();
            const propType = element.getType();
            const typeText = propType.getText();
            // Get default value if present
            const initializer = element.getInitializer();
            let defaultValue = undefined;
            if (initializer) {
                const initText = initializer.getText();
                // Try to parse simple values
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
            // Parse union types for options
            const options = parseUnionType(typeText);
            // Check if type includes undefined or null (meaning optional)
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
/**
 * Parse a union type string into individual options
 * e.g., '"default" | "destructive" | "outline"' -> ['default', 'destructive', 'outline']
 */
function parseUnionType(typeText) {
    // Check if it's a union type with string literals
    if (!typeText.includes('|'))
        return [];
    const options = [];
    const parts = typeText.split('|').map(p => p.trim());
    for (const part of parts) {
        // Match string literals: "value" or 'value'
        const match = part.match(/^["'](.+)["']$/);
        if (match) {
            options.push(match[1]);
        }
    }
    return options;
}
/**
 * Extract useState calls and their types
 */
function extractUseStateCalls(func) {
    const stateVars = [];
    const body = func.getBody();
    if (!body)
        return stateVars;
    // Find all variable declarations with useState
    const varDeclarations = body.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
    for (const varDecl of varDeclarations) {
        const initializer = varDecl.getInitializer();
        if (!initializer || !Node.isCallExpression(initializer))
            continue;
        const expression = initializer.getExpression();
        if (!Node.isIdentifier(expression) || expression.getText() !== 'useState')
            continue;
        // Get the destructured variable name: const [value, setValue] = useState()
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
        // Get type from useState<Type>() or infer from initial value
        const typeArgs = initializer.getTypeArguments();
        let typeText;
        if (typeArgs.length > 0) {
            typeText = typeArgs[0].getText();
        }
        else {
            // Infer from initial value
            const args = initializer.getArguments();
            if (args.length > 0) {
                typeText = args[0].getType().getText();
            }
            else {
                typeText = 'unknown';
            }
        }
        // Get initial value
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
                initialValue = []; // Array
            else if (argText.startsWith('{'))
                initialValue = {}; // Object
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
/**
 * Extract internal constants that could be mocked
 */
function extractInternalConstants(func) {
    const constants = [];
    const body = func.getBody();
    if (!body)
        return constants;
    // Find const declarations that aren't hooks
    const varStatements = body.getDescendantsOfKind(SyntaxKind.VariableStatement);
    for (const stmt of varStatements) {
        const declarations = stmt.getDeclarationList().getDeclarations();
        for (const decl of declarations) {
            const initializer = decl.getInitializer();
            if (!initializer)
                continue;
            // Skip hook calls
            if (Node.isCallExpression(initializer)) {
                const expr = initializer.getExpression();
                if (Node.isIdentifier(expr) && expr.getText().startsWith('use')) {
                    continue;
                }
            }
            // Skip function expressions and arrow functions (event handlers)
            if (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer)) {
                continue;
            }
            const nameNode = decl.getNameNode();
            if (!Node.isIdentifier(nameNode))
                continue;
            const name = nameNode.getText();
            const type = decl.getType().getText();
            // Get the type annotation if present
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
