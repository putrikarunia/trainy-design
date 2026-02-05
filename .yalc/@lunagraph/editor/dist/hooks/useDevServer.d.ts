export declare const DEV_SERVER_URL: string;
interface SaveFileOptions {
    filePath: string;
    elements: any[];
    stateContext?: Record<string, any>;
    internalComponent?: {
        name: string;
        startLine: number;
        endLine: number;
    };
}
interface SaveFileResponse {
    success: boolean;
    filePath?: string;
    code?: string;
    error?: string;
}
interface LoadFileResponse {
    success: boolean;
    filePath?: string;
    variables?: string[];
    initialValues?: Record<string, any>;
    props?: string[];
    raw?: string;
    error?: string;
}
export interface SnapshotProp {
    name: string;
    source: 'originalProp' | 'useState' | 'useContext' | 'customHook' | 'internalConstant';
    initialValue?: any;
    type?: string;
    hasImportDefault?: boolean;
}
export interface InternalComponent {
    name: string;
    startLine: number;
    endLine: number;
    props?: Record<string, {
        type: string;
        required: boolean;
    }>;
}
export interface CreateSnapshotResponse {
    success: boolean;
    componentPath?: string;
    snapshotPath?: string;
    snapshotComponentName?: string;
    componentName?: string;
    snapshotProps?: SnapshotProp[];
    initialMockValues?: Record<string, any>;
    internalComponents?: InternalComponent[];
    error?: string;
}
export interface DraftData {
    componentName: string;
    filePath: string;
    elements: any[];
    mockValues: Record<string, any>;
    savedAt: string;
    sourceFileModifiedAt: string | null;
}
export interface LoadDraftResponse {
    success: boolean;
    draft: DraftData | null;
    sourceModifiedSinceDraft?: boolean;
    error?: string;
}
export interface SaveDraftResponse {
    success: boolean;
    componentName?: string;
    savedAt?: string;
    error?: string;
}
export interface DeleteDraftResponse {
    success: boolean;
    componentName?: string;
    error?: string;
}
export interface DraftSummary {
    componentName: string;
    filePath: string;
    savedAt: string;
}
export interface ListDraftsResponse {
    success: boolean;
    drafts: DraftSummary[];
    error?: string;
}
export interface DraftVersion {
    filename: string;
    timestamp: string;
    createdAt: string;
}
export interface ListDraftVersionsResponse {
    success: boolean;
    versions: DraftVersion[];
    error?: string;
}
export interface GetDraftVersionResponse {
    success: boolean;
    version?: {
        filename: string;
        draft: DraftData;
    };
    error?: string;
}
export interface RestoreDraftVersionResponse {
    success: boolean;
    draft?: DraftData;
    error?: string;
}
export declare function useDevServer(): {
    loadFile: (filePath: string) => Promise<LoadFileResponse>;
    saveFile: (options: SaveFileOptions) => Promise<SaveFileResponse>;
    createSnapshot: (componentPath: string, componentName?: string) => Promise<CreateSnapshotResponse>;
    loadDraft: (componentName: string) => Promise<LoadDraftResponse>;
    saveDraft: (params: {
        componentName: string;
        filePath: string;
        elements: any[];
        mockValues?: Record<string, any>;
    }) => Promise<SaveDraftResponse>;
    deleteDraft: (componentName: string) => Promise<DeleteDraftResponse>;
    listDrafts: () => Promise<ListDraftsResponse>;
    listDraftVersions: (componentName: string) => Promise<ListDraftVersionsResponse>;
    getDraftVersion: (componentName: string, versionFilename: string) => Promise<GetDraftVersionResponse>;
    restoreDraftVersion: (componentName: string, versionFilename: string) => Promise<RestoreDraftVersionResponse>;
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
};
export {};
//# sourceMappingURL=useDevServer.d.ts.map