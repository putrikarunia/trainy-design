import { parse } from '@babel/parser';
import * as t from '@babel/types';
let idCounter = 0;
function generateId() {
    return `el-${Date.now()}-${idCounter++}`;
}
/**
 * Parse JSX code into FEElement tree
 * @param code - JSX code string to parse
 * @param iconLibraries - Optional icon library configurations to detect icon elements
 * @param components - Optional components map to prioritize over icons
 * @param defaultIconLibrary - Default icon library name for data-icon syntax (e.g., "@phosphor-icons/react" or "lucide-react")
 */
export function parseJSX(code, iconLibraries, components, defaultIconLibrary) {
    // Reset ID counter for consistent IDs in tests
    idCounter = 0;
    // Wrap code in a component if it's not already
    const wrappedCode = code.trim().startsWith('<')
        ? `function Component() { return (${code}) }`
        : code;
    try {
        const ast = parse(wrappedCode, {
            sourceType: 'module',
            plugins: ['jsx', 'typescript'],
        });
        // Find the JSX in the return statement
        const jsxElements = [];
        // Walk the AST to find JSX elements
        const walk = (node) => {
            if (t.isJSXElement(node)) {
                const element = parseJSXElement(node, iconLibraries, components, defaultIconLibrary);
                if (element) {
                    jsxElements.push(element);
                }
                return; // Don't traverse children (they're handled in parseJSXElement)
            }
            if (t.isJSXFragment(node)) {
                // Handle fragments by extracting children
                const children = node.children
                    .map((child) => parseJSXChild(child, iconLibraries, components, defaultIconLibrary))
                    .filter((el) => el !== null);
                jsxElements.push(...children);
                return;
            }
            // Recursively walk child nodes
            for (const key in node) {
                const child = node[key];
                if (child && typeof child === 'object') {
                    if (Array.isArray(child)) {
                        child.forEach(walk);
                    }
                    else {
                        walk(child);
                    }
                }
            }
        };
        walk(ast);
        return jsxElements;
    }
    catch (error) {
        console.error('Failed to parse JSX:', error);
        throw new Error(`Invalid JSX: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function parseJSXElement(node, iconLibraries, components, defaultIconLibrary) {
    const openingElement = node.openingElement;
    const tagName = getTagName(openingElement.name);
    if (!tagName)
        return null;
    // Determine if it's a component (starts with uppercase) or HTML element
    const isComponent = /^[A-Z]/.test(tagName);
    // Extract attributes
    const { styles, props } = parseAttributes(openingElement.attributes);
    // Check for data-icon attribute (icon syntax: <i data-icon="IconName" />)
    if (props && props['data-icon']) {
        const iconName = props['data-icon'];
        delete props['data-icon'];
        // Check for explicit library override via data-icon-library
        const explicitLibrary = props['data-icon-library'];
        if (explicitLibrary)
            delete props['data-icon-library'];
        // Build styles object for icon
        const iconStyles = styles ? { ...styles } : {};
        // Extract className to styles if present
        if (props.className) {
            iconStyles.className = props.className;
            delete props.className;
        }
        return {
            id: generateId(),
            type: 'icon',
            library: explicitLibrary || defaultIconLibrary || 'lucide-react',
            iconName: iconName,
            props: Object.keys(props).length > 0 ? props : {},
            styles: Object.keys(iconStyles).length > 0 ? iconStyles : undefined,
        };
    }
    // Parse children
    const children = node.children
        .map(child => parseJSXChild(child, iconLibraries, components, defaultIconLibrary))
        .filter((el) => el !== null);
    if (isComponent) {
        // First check if it's a local component (takes precedence over icons)
        const isLocalComponent = components && tagName in components;
        // Only check if it's an icon if it's NOT a local component
        if (!isLocalComponent && iconLibraries) {
            for (const [libraryName, config] of Object.entries(iconLibraries)) {
                const iconExists = config.icons[tagName];
                if (iconExists) {
                    // It's an icon! Create an IconElement
                    return {
                        id: generateId(),
                        type: 'icon',
                        library: libraryName,
                        iconName: tagName,
                        props: props || {},
                        styles,
                    };
                }
            }
        }
        return {
            id: generateId(),
            type: 'component',
            componentName: tagName,
            props,
            styles,
            children: children.length > 0 ? children : undefined,
        };
    }
    else {
        return {
            id: generateId(),
            type: 'html',
            tag: tagName.toLowerCase(),
            props,
            styles,
            children: children.length > 0 ? children : undefined,
        };
    }
}
function parseJSXChild(child, iconLibraries, components, defaultIconLibrary) {
    if (t.isJSXElement(child)) {
        return parseJSXElement(child, iconLibraries, components, defaultIconLibrary);
    }
    if (t.isJSXText(child)) {
        const text = child.value.trim();
        if (!text)
            return null;
        return {
            id: generateId(),
            type: 'text',
            tag: 'span',
            text,
        };
    }
    if (t.isJSXExpressionContainer(child)) {
        // For now, skip expression containers (they'll be handled by dev later)
        // TODO: Handle {variable} expressions
        return null;
    }
    if (t.isJSXFragment(child)) {
        // Fragments don't have their own element, just return children
        // This is a simplification - we'd need to handle this better
        return null;
    }
    return null;
}
function getTagName(name) {
    if (t.isJSXIdentifier(name)) {
        return name.name;
    }
    if (t.isJSXMemberExpression(name)) {
        // Handle <Foo.Bar />
        const parts = [];
        let current = name;
        while (t.isJSXMemberExpression(current)) {
            if (t.isJSXIdentifier(current.property)) {
                parts.unshift(current.property.name);
            }
            current = current.object;
        }
        if (t.isJSXIdentifier(current)) {
            parts.unshift(current.name);
        }
        return parts.join('.');
    }
    return null;
}
function parseAttributes(attributes) {
    const styles = {};
    const props = {};
    for (const attr of attributes) {
        if (t.isJSXAttribute(attr)) {
            const name = t.isJSXIdentifier(attr.name) ? attr.name.name : null;
            if (!name)
                continue;
            const value = parseAttributeValue(attr.value);
            if (name === 'style' && typeof value === 'object') {
                Object.assign(styles, value);
            }
            else if (name !== 'style') {
                props[name] = value;
            }
        }
        if (t.isJSXSpreadAttribute(attr)) {
            // Handle {...spread} - we'd need to evaluate this at runtime
            // For now, skip it
            continue;
        }
    }
    return {
        styles: Object.keys(styles).length > 0 ? styles : undefined,
        props: Object.keys(props).length > 0 ? props : undefined,
    };
}
function parseAttributeValue(value) {
    if (!value)
        return true; // Boolean attribute like <input disabled />
    if (t.isStringLiteral(value)) {
        return value.value;
    }
    if (t.isJSXExpressionContainer(value)) {
        const expression = value.expression;
        if (t.isStringLiteral(expression)) {
            return expression.value;
        }
        if (t.isNumericLiteral(expression)) {
            return expression.value;
        }
        if (t.isBooleanLiteral(expression)) {
            return expression.value;
        }
        if (t.isObjectExpression(expression)) {
            // Parse object literal
            const obj = {};
            for (const prop of expression.properties) {
                if (t.isObjectProperty(prop)) {
                    // Handle both identifier keys (display) and string literal keys ("display")
                    let key = null;
                    if (t.isIdentifier(prop.key)) {
                        key = prop.key.name;
                    }
                    else if (t.isStringLiteral(prop.key)) {
                        key = prop.key.value;
                    }
                    if (key) {
                        if (t.isStringLiteral(prop.value)) {
                            obj[key] = prop.value.value;
                        }
                        else if (t.isNumericLiteral(prop.value)) {
                            obj[key] = prop.value.value;
                        }
                        else if (t.isBooleanLiteral(prop.value)) {
                            obj[key] = prop.value.value;
                        }
                    }
                }
            }
            return obj;
        }
        // For other expressions, return a placeholder
        // TODO: Handle more expression types
        return undefined;
    }
    return undefined;
}
