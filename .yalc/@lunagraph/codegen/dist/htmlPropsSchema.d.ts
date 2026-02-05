/**
 * Whitelist of important HTML props per element type.
 * These are commonly used props that should be shown in the props panel.
 *
 * Used by:
 * - CLI scanner: to extract important props for components extending HTML elements
 * - Editor PropsPanel: to show editable props for HTML elements
 */
export declare const importantHtmlProps: Record<string, string[]>;
/**
 * Schema with type information for PropsPanel rendering.
 * Maps element tag to array of prop definitions with type and label.
 */
export declare const htmlPropsSchema: Record<string, {
    type: 'string' | 'number' | 'boolean';
    label: string;
}[]>;
