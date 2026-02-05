import { ExtractedComponent } from './extractComponentReturn.js';
export interface SnapshotGenerationOptions {
    /** Path to the source component file (relative to project root), e.g., "components/section-cards.tsx" */
    sourcePath: string;
    /** Path to the snapshots directory (relative to project root), e.g., ".lunagraph/snapshots" */
    snapshotDir: string;
}
export interface SnapshotGenerationResult {
    /** The generated snapshot code */
    code: string;
    /** Prop names that the snapshot component expects (for mock value generation) */
    snapshotProps: SnapshotProp[];
}
export interface SnapshotProp {
    name: string;
    /** Where this prop came from */
    source: 'originalProp' | 'useState' | 'useContext' | 'customHook' | 'internalConstant';
    /** Initial/default value if available */
    initialValue?: any;
    /** TypeScript type if available */
    type?: string;
    /** For union types, the individual options (e.g., ['default', 'destructive', 'outline']) */
    options?: string[];
    /** True if this prop has an import-based default (e.g., columns = tasksColumns) - shouldn't be shown in State Panel */
    hasImportDefault?: boolean;
}
/** Type info extracted via ts-morph (optional, for better type annotations) */
export interface ExtractedPropType {
    name: string;
    type: string;
    required: boolean;
    options?: string[];
    defaultValue?: any;
}
export interface ExtractedTypes {
    props: ExtractedPropType[];
    stateVariables: ExtractedPropType[];
    internalConstants: ExtractedPropType[];
}
/**
 * Generate a snapshot component file from extracted component data.
 *
 * The snapshot:
 * - Preserves all imports (filters out useState, useEffect, useContext from React)
 * - Preserves all type declarations
 * - Preserves all module-level constants and functions
 * - Converts internal state/hooks/context to props
 * - Keeps useMemo/useCallback (they compute values for render)
 * - Keeps useRef (needed for DOM references)
 * - Removes useEffect/useLayoutEffect (side effects)
 * - No-ops event handlers
 *
 * @param extracted - AST-extracted component data
 * @param extractedTypes - Optional ts-morph extracted types for better type annotations
 */
export declare function generateSnapshot(extracted: ExtractedComponent, extractedTypes?: ExtractedTypes | null, options?: SnapshotGenerationOptions): SnapshotGenerationResult;
