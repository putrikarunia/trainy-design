/**
 * Utilities for working with icon libraries
 */
/**
 * Extract valid icon component names from an icon library object.
 * Filters out non-component exports (contexts, utilities, types).
 */
export function extractIconNames(icons, explicitNames) {
    // Guard against undefined/null icons
    if (!icons || typeof icons !== 'object') {
        return [];
    }
    // If explicit names provided, use those
    if (explicitNames && explicitNames.length > 0) {
        return explicitNames.filter(name => {
            const value = icons[name];
            return typeof value === 'function' ||
                (typeof value === 'object' && value !== null && '$$typeof' in value);
        });
    }
    return Object.entries(icons)
        .filter(([name, value]) => isIconComponent(name, value))
        .map(([name]) => name)
        .sort();
}
/**
 * Determine if an export is likely an icon component.
 */
function isIconComponent(name, value) {
    // Must be a function or React component object (forwardRef, memo, etc.)
    const isReactComponent = typeof value === 'function' ||
        (typeof value === 'object' && value !== null && '$$typeof' in value);
    if (!isReactComponent)
        return false;
    // Skip common non-icon exports
    const skipPatterns = [
        /Icon$/, // Lucide duplicates: ActivityIcon (skip in favor of Activity)
        /^Lucide/, // Lucide duplicates: LucideActivity (skip in favor of Activity)
        /Context$/, // IconContext, ThemeContext
        /Provider$/, // IconProvider
        /Consumer$/, // IconConsumer
        /^use[A-Z]/, // useIcon, useTheme (hooks)
        /^create[A-Z]/, // createIcon, createStyledIcon
        /^with[A-Z]/, // withIcon (HOCs)
        /^default$/i, // default export
        /^Icon$/, // Generic Icon component
        /^__/, // Internal exports
        /^SSR/, // SSR utilities
    ];
    if (skipPatterns.some(pattern => pattern.test(name))) {
        return false;
    }
    // Icon names should be PascalCase (start with uppercase)
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
        return false;
    }
    return true;
}
/**
 * Check if a specific icon exists in a library.
 */
export function hasIcon(icons, iconName) {
    if (!icons || typeof icons !== 'object' || !iconName) {
        return false;
    }
    const value = icons[iconName];
    return typeof value === 'function' ||
        (typeof value === 'object' && value !== null && '$$typeof' in value);
}
/**
 * Search icons by query (fuzzy match on name).
 */
export function searchIcons(iconNames, query) {
    // Guard against undefined/null iconNames
    if (!iconNames || !Array.isArray(iconNames)) {
        return [];
    }
    if (!query || !query.trim())
        return iconNames;
    const lowerQuery = query.toLowerCase();
    // Exact prefix match first, then includes match
    const prefixMatches = [];
    const includesMatches = [];
    for (const name of iconNames) {
        if (typeof name !== 'string')
            continue;
        const lowerName = name.toLowerCase();
        if (lowerName.startsWith(lowerQuery)) {
            prefixMatches.push(name);
        }
        else if (lowerName.includes(lowerQuery)) {
            includesMatches.push(name);
        }
    }
    return [...prefixMatches, ...includesMatches];
}
