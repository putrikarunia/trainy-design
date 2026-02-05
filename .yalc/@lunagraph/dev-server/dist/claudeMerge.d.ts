export interface ClaudeMergeOptions {
    originalCode: string;
    generatedJSX: string;
    filePath: string;
    componentImports?: Array<{
        component: string;
        importPath: string;
    }>;
    stateContext?: Record<string, any>;
    internalComponentName?: string;
    internalComponentRange?: {
        startLine: number;
        endLine: number;
    };
}
/**
 * Use Claude CLI to intelligently merge generated JSX into existing file
 * Preserves: logic, expressions, styling approach, imports, hooks
 */
export declare function mergeWithClaude(options: ClaudeMergeOptions): Promise<string>;
/**
 * Check if Claude CLI is available
 */
export declare function isClaudeAvailable(): Promise<boolean>;
