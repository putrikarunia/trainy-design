export interface PageInfo {
    id: string;
    name: string;
    elementCount?: number;
}
interface PagesPanelProps {
    pages: PageInfo[];
    activePageId: string;
    onSelectPage: (pageId: string) => void;
    onCreatePage: () => void;
    onRenamePage?: (pageId: string, newName: string) => void;
    onDeletePage?: (pageId: string) => void;
    readOnly?: boolean;
}
export declare function PagesPanel({ pages, activePageId, onSelectPage, onCreatePage, onRenamePage, onDeletePage, readOnly, }: PagesPanelProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=PagesPanel.d.ts.map