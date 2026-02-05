/**
 * Utilities for extracting and filtering computed CSS styles
 */
/**
 * Convert camelCase to kebab-case
 */
export declare function camelToKebab(str: string): string;
/**
 * Convert kebab-case to camelCase
 */
export declare function kebabToCamel(str: string): string;
export interface CascadeSource {
    selector: string;
    value: string;
    type: 'class' | 'inline';
    isActive: boolean;
}
export interface ComputedStyleEntry {
    property: string;
    displayProperty: string;
    value: string;
    isUserOverride: boolean;
    isInlineStyle: boolean;
    cascade?: CascadeSource[];
}
/**
 * Get cascade sources for a specific CSS property
 * Tests each class individually to see what it contributes
 * Only called when user expands the chevron (lazy-loaded)
 */
export declare function getCascadeForProperty(element: HTMLElement, property: string, kebabProperty: string, computedValue: string): CascadeSource[];
/**
 * Extract significant computed styles from a DOM element
 * Uses baseline comparison to filter out inherited/default styles
 */
export declare function extractComputedStyles(element: HTMLElement, userOverrides?: React.CSSProperties): ComputedStyleEntry[];
//# sourceMappingURL=computedStyles.d.ts.map