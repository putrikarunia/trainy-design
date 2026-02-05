import { FEElement, IconLibraryConfig } from "./types";
import { ComponentIndex } from "./LunagraphEditor";
interface PropsPanelProps {
    selectedElementId: string | null;
    elements: FEElement[];
    componentIndex?: ComponentIndex;
    iconLibraries?: Record<string, IconLibraryConfig>;
    onUpdateElementProps: (elementId: string, props: Record<string, any>) => void;
    onReplaceElement?: (oldElementId: string, newElement: FEElement) => void;
    onOpenComponent?: (componentName: string, filePath: string) => void;
    renderMode?: 'felement' | 'snapshot';
    readOnly?: boolean;
}
export default function PropsPanel({ selectedElementId, elements, componentIndex, iconLibraries, onUpdateElementProps, onReplaceElement, onOpenComponent, renderMode, readOnly, }: PropsPanelProps): import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=PropsPanel.d.ts.map