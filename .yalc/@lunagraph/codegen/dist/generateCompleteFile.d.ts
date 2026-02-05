import type { FEElement } from './types.js';
import { type ComponentIndex } from './generateImports.js';
export interface GenerateFileOptions {
    componentName: string;
    elements: FEElement[];
    componentIndex: ComponentIndex;
    targetFilePath?: string;
    includeReactImport?: boolean;
}
/**
 * Generate a complete TypeScript/React component file
 */
export declare function generateCompleteFile(options: GenerateFileOptions): string;
