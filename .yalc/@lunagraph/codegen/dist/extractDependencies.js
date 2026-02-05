/**
 * Extract unique component names from FEElement tree
 */
export function extractComponentDependencies(elements) {
    const components = new Set();
    function traverse(element) {
        if (element.type === 'component') {
            components.add(element.componentName);
        }
        if ('children' in element && element.children) {
            element.children.forEach(traverse);
        }
    }
    elements.forEach(traverse);
    return components;
}
/**
 * Extract icon dependencies from element tree
 * Returns a Map of library -> Set of icon names
 */
export function extractIconDependencies(elements) {
    const iconsByLibrary = new Map();
    function traverse(element) {
        if (element.type === 'icon') {
            if (!iconsByLibrary.has(element.library)) {
                iconsByLibrary.set(element.library, new Set());
            }
            iconsByLibrary.get(element.library).add(element.iconName);
        }
        if ('children' in element && element.children) {
            element.children.forEach(traverse);
        }
    }
    elements.forEach(traverse);
    return iconsByLibrary;
}
