import { type SnapshotProp } from '@lunagraph/codegen';
export interface InternalComponentMeta {
    name: string;
    startLine: number;
    endLine: number;
}
export interface SnapshotMetadata {
    componentName: string;
    snapshotComponentName: string;
    filePath: string;
    snapshotPath: string;
    snapshotProps: SnapshotProp[];
    initialMockValues: Record<string, any>;
    /** Source code of the original component (for read-only mode) */
    sourceCode: string;
    /** Internal components defined in this file */
    internalComponents?: InternalComponentMeta[];
}
export declare function generateSnapshotsCommand(options: {
    output?: string;
    component?: string;
}): Promise<void>;
