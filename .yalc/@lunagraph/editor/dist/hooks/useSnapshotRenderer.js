import { useState, useCallback, useRef, useEffect } from 'react';
import * as React from 'react';
/**
 * Generate a stable ID based on element structure.
 * Uses path (index at each level) to create deterministic IDs.
 */
function generateStableId(prefix, path) {
    return `${prefix}-${path.join('-')}`;
}
/**
 * Get the display name of a React element type and whether it's registered
 */
function getComponentInfo(type, componentsMap) {
    // Try to match against known components (exact reference match)
    for (const [name, comp] of Object.entries(componentsMap)) {
        if (type === comp) {
            return { name, isRegistered: true };
        }
    }
    // Not registered - get name from displayName/name
    let name = 'Unknown';
    // HTML element
    if (typeof type === 'string') {
        name = type;
    }
    // Function component
    else if (typeof type === 'function') {
        name = type.displayName || type.name || 'Unknown';
    }
    // forwardRef, memo, etc.
    else if (type && typeof type === 'object') {
        if (type.displayName)
            name = type.displayName;
        else if (type.render?.displayName)
            name = type.render.displayName;
        else if (type.render?.name)
            name = type.render.name;
        else if (type.type?.displayName)
            name = type.type.displayName;
        else if (type.type?.name)
            name = type.type.name;
    }
    return { name, isRegistered: false };
}
/**
 * Check if a value is serializable (can be JSON.stringify'd without error)
 */
function isSerializable(value, seen = new WeakSet()) {
    if (value === null || value === undefined)
        return true;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
        return true;
    if (typeof value === 'function')
        return false;
    if (typeof value !== 'object')
        return false;
    // Check for circular references
    if (seen.has(value))
        return false;
    seen.add(value);
    // Check if object has methods
    for (const v of Object.values(value)) {
        if (typeof v === 'function')
            return false;
        if (typeof v === 'object' && v !== null && !isSerializable(v, seen))
            return false;
    }
    return true;
}
/**
 * Filter props to only include serializable values
 */
function sanitizeProps(props) {
    const result = {};
    for (const [key, value] of Object.entries(props)) {
        if (isSerializable(value)) {
            result[key] = value;
        }
    }
    return result;
}
/**
 * Check if a tag name is an HTML element
 */
function isHtmlTag(tag) {
    const htmlTags = new Set([
        'div', 'span', 'p', 'a', 'button', 'input', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot',
        'form', 'label', 'select', 'option', 'textarea', 'nav', 'header', 'footer',
        'main', 'section', 'article', 'aside', 'figure', 'figcaption', 'svg', 'path',
        'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'g', 'defs', 'use',
        'video', 'audio', 'source', 'track', 'canvas', 'iframe', 'embed', 'object',
        'pre', 'code', 'blockquote', 'hr', 'br', 'strong', 'em', 'b', 'i', 'u', 's',
        'small', 'sub', 'sup', 'mark', 'del', 'ins', 'abbr', 'dfn', 'kbd', 'samp', 'var',
    ]);
    return htmlTags.has(tag.toLowerCase());
}
/**
 * Convert a React element tree directly to FEElement[] without string serialization.
 *
 * This always expands children to show the full tree structure in the layers panel.
 * The actual rendering in the canvas is done by the snapshot component (which has real props).
 *
 * This preserves complex props like `table` from useReactTable.
 */
function reactElementToFEElements(node, componentsMap, iconLibraries, path = [0]) {
    if (node === null || node === undefined) {
        return [];
    }
    // Handle text content
    if (typeof node === 'string' || typeof node === 'number') {
        return [{
                id: generateStableId('text', path),
                type: 'text',
                tag: 'span',
                text: String(node),
            }];
    }
    // Handle arrays
    if (Array.isArray(node)) {
        return node.flatMap((child, index) => reactElementToFEElements(child, componentsMap, iconLibraries, [...path, index]));
    }
    // Handle React elements
    if (!React.isValidElement(node)) {
        return [];
    }
    const element = node;
    const { type, props } = element;
    // Handle React.Fragment - unwrap children directly (fragments have no DOM representation)
    if (type === React.Fragment) {
        const { children } = props || {};
        if (children) {
            return reactElementToFEElements(children, componentsMap, iconLibraries, path);
        }
        return [];
    }
    const { name: componentName, isRegistered } = getComponentInfo(type, componentsMap);
    // Extract children and other props
    const { children, style, className, ...otherProps } = props || {};
    // Convert children recursively - always expand for layer tree visibility
    const feChildren = children ? reactElementToFEElements(children, componentsMap, iconLibraries, [...path, 0]) : [];
    // Sanitize props to remove non-serializable values (functions, circular refs, etc.)
    const sanitizedProps = sanitizeProps({ ...otherProps, className });
    // Check if this is an icon from one of the registered icon libraries
    if (iconLibraries) {
        for (const [libraryName, library] of Object.entries(iconLibraries)) {
            // Check if the component type matches any icon in this library
            for (const [iconName, IconComponent] of Object.entries(library.icons)) {
                if (type === IconComponent) {
                    // This is an icon! Create an icon FEElement
                    const feElement = {
                        id: generateStableId('icon', path),
                        type: 'icon',
                        library: libraryName,
                        iconName,
                        props: sanitizedProps,
                        styles: style,
                    };
                    return [feElement];
                }
            }
        }
    }
    // Build the FEElement
    if (typeof type === 'string' && isHtmlTag(type)) {
        // HTML element
        const feElement = {
            id: generateStableId('html', path),
            type: 'html',
            tag: type.toLowerCase(),
            props: sanitizedProps,
            styles: style,
            children: feChildren.length > 0 ? feChildren : undefined,
        };
        return [feElement];
    }
    else {
        // Component element - store whether it's registered so renderElement knows
        // if it should render via registry or pass through to snapshot
        const feElement = {
            id: generateStableId('component', path),
            type: 'component',
            componentName,
            props: sanitizedProps,
            styles: style,
            children: feChildren.length > 0 ? feChildren : undefined,
            isRegistered, // true = render via registry, false = library component
            // For unregistered components, store the actual component reference
            // so renderElement can render it directly
            componentRef: !isRegistered ? type : undefined,
        };
        return [feElement];
    }
}
/**
 * Renders a snapshot component with mock values and converts to FEElements.
 *
 * This hook returns:
 * 1. `elements` - The parsed FEElements for the canvas
 * 2. `rendererElement` - A React element that must be rendered in the component tree
 *    (renders invisibly but allows snapshot hooks to execute in proper React context)
 *
 * The snapshot component calls back with its React element tree via __onRender.
 * We then recursively expand that tree (calling child components as functions)
 * to get a fully static tree before serializing.
 */
export function useSnapshotRenderer({ snapshotComponentName, mockValues, snapshots, components, iconLibraries, key, }) {
    const [elements, setElements] = useState([]);
    const componentsRef = useRef(components);
    const iconLibrariesRef = useRef(iconLibraries);
    const mockValuesRef = useRef(mockValues);
    const remountCounterRef = useRef(0);
    componentsRef.current = components;
    iconLibrariesRef.current = iconLibraries;
    // Increment counter when mockValues actually change
    if (JSON.stringify(mockValues) !== JSON.stringify(mockValuesRef.current)) {
        mockValuesRef.current = mockValues;
        remountCounterRef.current++;
    }
    // Track last elements to prevent infinite loops
    const lastElementsRef = useRef('');
    // Callback that snapshot component calls with its element tree
    const handleRender = useCallback((element) => {
        if (!element) {
            if (lastElementsRef.current !== '[]') {
                lastElementsRef.current = '[]';
                setElements([]);
            }
            return;
        }
        try {
            // Convert React element tree directly to FEElements (preserves complex props like useReactTable's `table`)
            const feElements = reactElementToFEElements(element, componentsRef.current, iconLibrariesRef.current);
            // Only update if elements actually changed (prevent infinite loop)
            const elementsKey = JSON.stringify(feElements);
            if (elementsKey === lastElementsRef.current) {
                return;
            }
            lastElementsRef.current = elementsKey;
            setElements(feElements);
        }
        catch (error) {
            console.error('[useSnapshotRenderer] Failed to convert element:', error);
            if (lastElementsRef.current !== '[]') {
                lastElementsRef.current = '[]';
                setElements([]);
            }
        }
    }, []);
    // Look up snapshot component
    const SnapshotComponent = snapshotComponentName ? snapshots[snapshotComponentName] : null;
    // Filter out undefined values from mockValues
    // This is important because passing { size: undefined } to cva() won't apply defaults
    // but omitting the key entirely will apply the default
    const filteredMockValues = {};
    for (const [k, value] of Object.entries(mockValues)) {
        if (value !== undefined) {
            filteredMockValues[k] = value;
        }
    }
    // Create the renderer element that will be placed in the component tree
    // This allows the snapshot's hooks to run in a proper React context
    // Use counter to ensure React remounts when mockValues change
    const elementKey = `${key}-${remountCounterRef.current}`;
    const rendererElement = SnapshotComponent ? (React.createElement('div', { key: elementKey, style: { display: 'contents' } }, React.createElement(SnapshotComponent, {
        ...filteredMockValues,
        __onRender: handleRender,
    }))) : null;
    // Clear elements if no snapshot component
    useEffect(() => {
        if (!SnapshotComponent) {
            setElements([]);
        }
    }, [SnapshotComponent]);
    return { elements, rendererElement };
}
