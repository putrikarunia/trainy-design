export interface ExtractedPropType {
    name: string;
    type: string;
    required: boolean;
    /** For union types, the individual options */
    options?: string[];
    /** Default value if specified in function params */
    defaultValue?: any;
}
export interface ExtractedTypes {
    /** Original component props with their types */
    props: ExtractedPropType[];
    /** useState variables with their types */
    stateVariables: ExtractedPropType[];
    /** Internal constants that could be mocked */
    internalConstants: ExtractedPropType[];
}
/**
 * Extract TypeScript types from a component file using ts-morph
 * This gives us proper type information for:
 * - Original props (including union types like variant: "default" | "destructive")
 * - useState hooks (useState<number | null>)
 * - Internal constants (const products: Product[] = ...)
 */
export declare function extractTypesFromFile(filePath: string, rootDir: string): ExtractedTypes | null;
