import { FEElement } from "./types";
import { ComponentIndex } from "./LunagraphEditor";
interface InternalComponent {
    name: string;
    startLine: number;
    endLine: number;
}
interface AssetsPanelProps {
    onAddElement: (element: FEElement) => void;
    onEditComponent?: (componentName: string, filePath: string) => void;
    onEditInternalComponent?: (componentName: string, parentFilePath: string, startLine: number, endLine: number) => void;
    componentIndex?: ComponentIndex;
    readOnly?: boolean;
    draftComponentNames?: Set<string>;
    internalComponents?: InternalComponent[];
    activeFileName?: string;
    activeFilePath?: string;
}
export declare const AssetsPanel: ({ onAddElement, onEditComponent, onEditInternalComponent, componentIndex, readOnly, draftComponentNames, internalComponents, activeFileName, activeFilePath, }: AssetsPanelProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=AssetsPanel.d.ts.map