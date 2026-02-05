import { FEElement } from "./types";
export interface HTMLTagData {
    tag: string;
    title: string;
    description: string;
    defaultStyles: React.CSSProperties;
    previewColor: string;
    category: 'layout' | 'text' | 'media' | 'form' | 'semantic';
}
export declare const htmlTags: HTMLTagData[];
export declare const createElementFromTag: (tagData: HTMLTagData) => FEElement;
//# sourceMappingURL=htmlTagsData.d.ts.map