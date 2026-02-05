/**
 * Categorized hook call information for snapshot transformation
 */
export interface HookCall {
    type: 'useState' | 'useContext' | 'useMemo' | 'useCallback' | 'useEffect' | 'useLayoutEffect' | 'useRef' | 'custom';
    /** The full hook call code (e.g., "const [count, setCount] = useState(0)") */
    code: string;
    /** Variables extracted from the hook (state values, context values, etc.) */
    extractedVariables: string[];
    /** For useState: the setter function name */
    setterName?: string;
    /** For hooks with initial values */
    initialValue?: any;
    /** Hook name for custom hooks (e.g., "useQuery", "useIsMobile") */
    hookName?: string;
    /**
     * Whether this hook should be kept in the snapshot (not converted to props).
     * True when the hook returns an object with methods called in JSX (e.g., table.getHeaderGroups()).
     * These can't be mocked - the hook must run with mocked inputs instead.
     */
    keepInSnapshot?: boolean;
}
/**
 * Complete extraction result for snapshot generation
 */
export interface ExtractedComponent {
    /** Component function name (e.g., "ProductList") */
    componentName: string;
    /** Original props interface/type as string (e.g., "{ className?: string }") */
    propsType: string | null;
    /** Full import statement strings */
    imports: string[];
    /** Names of all imported identifiers (for filtering) */
    importedNames: string[];
    /** Full type/interface declaration strings */
    typeDeclarations: string[];
    /** Module-level constant declarations (const COLORS = {...}) */
    moduleConstants: Record<string, any>;
    /** Module-level constant declaration strings (full code) */
    moduleConstantDeclarations: string[];
    /** Module-level function declarations (function formatPrice() {...}) */
    moduleFunctionDeclarations: string[];
    /** Prop names from function parameters */
    props: string[];
    /** Default values for props that have identifier defaults (e.g., columns = tasksColumns) */
    propDefaults: Record<string, string>;
    /** All categorized hook calls inside the component */
    hookCalls: HookCall[];
    /** Non-hook variable declarations inside component (const products = [...]) */
    variableDeclarations: string[];
    /** Initial values for variables (for mock value generation) */
    initialValues: Record<string, any>;
    /** Variables used in JSX (for dependency tracking) */
    variables: string[];
    /** The return JSX string (for simple single-return components) */
    returnJSX: string;
    /** Conditional return info (for components with if/return patterns) */
    conditionalReturns?: ConditionalReturn[];
    /** Non-exported PascalCase components defined in the same file (for editing in AssetPanel) */
    internalComponents?: InternalComponent[];
    /** Names of other exported components in the same file (for snapshot imports) */
    siblingExportedComponents?: string[];
}
/**
 * Represents an internal (non-exported) component defined in the same file
 */
export interface InternalComponent {
    /** Component name (e.g., "ModuleBadge") */
    name: string;
    /** Start line number in source file (1-indexed) */
    startLine: number;
    /** End line number in source file (1-indexed) */
    endLine: number;
    /** Props extracted from the component's function parameters */
    props?: Record<string, {
        type: string;
        required: boolean;
    }>;
}
/**
 * Represents a conditional return statement in a component
 */
export interface ConditionalReturn {
    /** The condition expression as code (e.g., "isEditMode") - null for the final/default return */
    condition: string | null;
    /** The JSX being returned */
    jsx: string;
}
/**
 * Options for extractComponentReturn
 */
export interface ExtractComponentOptions {
    /** Target component name to prioritize (e.g., from file name) */
    targetComponentName?: string;
}
/**
 * Extracts the return statement JSX and finds all variables used in it
 */
export declare function extractComponentReturn(code: string, options?: ExtractComponentOptions): ExtractedComponent | null;
