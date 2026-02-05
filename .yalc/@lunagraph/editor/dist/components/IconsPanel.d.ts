import { IconElement, IconLibraryConfig } from "./types";
interface IconsPanelProps {
    iconLibraries: Record<string, IconLibraryConfig>;
    onAddElement: (element: IconElement) => void;
    readOnly?: boolean;
}
export declare function IconsPanel({ iconLibraries, onAddElement, readOnly }: IconsPanelProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=IconsPanel.d.ts.map