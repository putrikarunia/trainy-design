/**
 * Component index entry structure
 */
export interface ComponentIndexEntry {
    path: string;
    exportName: string;
    props?: Record<string, any>;
}
export type ComponentIndex = Record<string, ComponentIndexEntry>;
/**
 * Generate import statements from component dependencies
 *
 * @param componentNames - Set of component names used in the JSX
 * @param componentIndex - ComponentIndex.json mapping
 * @param targetFilePath - Path of the file being generated (for relative imports)
 * @returns Array of import statements
 */
export declare function generateImports(componentNames: Set<string>, componentIndex: ComponentIndex, targetFilePath?: string): string[];
/**
 * Generate import statements for icons grouped by library
 *
 * @param iconsByLibrary - Map of library name -> Set of icon names
 * @returns Array of import statements
 */
export declare function generateIconImports(iconsByLibrary: Map<string, Set<string>>): string[];
/**
 * Get component import mappings (for use in prompts/hints)
 * Returns array of { component, importPath } objects
 */
export declare function getComponentImportMappings(componentNames: Set<string>, componentIndex: ComponentIndex): Array<{
    component: string;
    importPath: string;
}>;
