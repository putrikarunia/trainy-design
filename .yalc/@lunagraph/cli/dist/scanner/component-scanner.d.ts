export interface ComponentInfo {
    path: string;
    exportName: string;
    props?: Record<string, any>;
}
export interface ComponentIndex {
    [componentName: string]: ComponentInfo;
}
/**
 * Scans a directory for React components and extracts their metadata
 */
export declare class ComponentScanner {
    private rootDir;
    private project;
    private componentIndex;
    constructor(rootDir: string);
    /**
     * Scan a single glob pattern for components.
     */
    scan(pattern?: string): Promise<ComponentIndex>;
    /**
     * Scan multiple glob patterns for components.
     */
    scanMultiple(patterns: string[]): Promise<ComponentIndex>;
    /**
     * Check if a node is a React component
     */
    private isReactComponent;
    /**
     * Extract props from a type node (for forwardRef type parameters)
     */
    private extractPropsFromTypeNode;
    /**
     * Detect HTML element name from type text (e.g., "button" from ComponentProps<"button">)
     */
    private detectHTMLElement;
    /**
     * Get base HTML element props by creating a temporary type
     */
    private getBaseHTMLElementProps;
    /**
     * Extract props from inline type literals in an intersection type
     */
    private extractInlineProps;
    /**
     * Extract props from a component
     */
    private extractProps;
    /**
     * Check if a declaration is from an external library (node_modules)
     */
    private isExternalLibrary;
    /**
     * Check if an export name looks like a React component (PascalCase)
     */
    private looksLikeComponentName;
    /**
     * Scan a single file for exported React components
     */
    private scanFile;
    /**
     * Write the component index to a JSON file
     */
    writeIndex(outputPath: string): Promise<void>;
    /**
     * Generate the components.ts file with auto-imports
     */
    writeComponentsFile(outputPath: string): Promise<void>;
}
