/**
 * Utilities for working with icon libraries
 */
/**
 * Extract valid icon component names from an icon library object.
 * Filters out non-component exports (contexts, utilities, types).
 */
export declare function extractIconNames(icons: Record<string, any> | undefined | null, explicitNames?: string[]): string[];
/**
 * Check if a specific icon exists in a library.
 */
export declare function hasIcon(icons: Record<string, any> | undefined | null, iconName: string): boolean;
/**
 * Search icons by query (fuzzy match on name).
 */
export declare function searchIcons(iconNames: string[] | undefined | null, query: string): string[];
//# sourceMappingURL=iconUtils.d.ts.map