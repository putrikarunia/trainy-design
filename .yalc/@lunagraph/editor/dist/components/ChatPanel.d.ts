import React from 'react';
import type { FEElement } from './types';
interface ToolResultWithId {
    type: 'add_jsx' | 'update_jsx' | 'delete_element' | 'replace_with_component' | 'Read' | 'Write' | 'LS' | 'Glob';
    payload: any;
    createdElementId?: string;
    createdElementIds?: string[];
}
interface Attachment {
    type: 'element' | 'image' | 'file';
    id: string;
    name: string;
    data?: string;
}
interface InlineReference {
    type: 'element' | 'image' | 'file';
    id: string;
    name: string;
    data?: string;
}
interface ChatMessageItem {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    toolResults?: ToolResultWithId[];
    attachments?: Attachment[];
    inlineRefs?: InlineReference[];
}
interface ChatPanelProps {
    elements: FEElement[];
    selectedElementIds: Set<string>;
    availableComponents: string[];
    devServerUrl: string;
    canvasId?: string;
    messages: ChatMessageItem[];
    onMessagesChange: (messages: ChatMessageItem[]) => void;
    onToolResult: (result: ToolResultWithId) => string | undefined;
    onSelectElement: (elementId: string) => void;
    iconLibraryName?: string;
}
export interface ChatPanelHandle {
    addSelectedElements: () => void;
}
export declare const ChatPanel: React.ForwardRefExoticComponent<ChatPanelProps & React.RefAttributes<ChatPanelHandle>>;
export type { ChatMessageItem, ToolResultWithId };
//# sourceMappingURL=ChatPanel.d.ts.map