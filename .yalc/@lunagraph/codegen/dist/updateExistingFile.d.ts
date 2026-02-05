import type { FEElement } from './types.js';
import { type ComponentIndex } from './generateImports.js';
export interface UpdateFileOptions {
    existingCode: string;
    elements: FEElement[];
    componentIndex: ComponentIndex;
    targetFilePath?: string;
}
/**
 * Update an existing file by replacing the JSX in the return statement
 * and updating imports accordingly
 */
export declare function updateExistingFile(options: UpdateFileOptions): string;
