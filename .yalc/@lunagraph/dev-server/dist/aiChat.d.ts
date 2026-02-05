import { type FEElement } from '@lunagraph/codegen';
import type { Response } from 'express';
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}
export interface InlineRef {
    type: 'element' | 'image' | 'file';
    id: string;
    name: string;
    data?: string;
}
export interface ChatContext {
    canvasElements: FEElement[];
    availableComponents: string[];
    selectedElementId?: string;
    selectedElement?: FEElement | null;
    attachedElements?: FEElement[];
    inlineRefs?: InlineRef[];
    iconLibraryName?: string;
}
export interface ToolResult {
    type: 'add_jsx' | 'update_jsx' | 'delete_element' | 'replace_with_component' | 'Read' | 'Write' | 'LS' | 'Glob';
    payload: any;
}
export declare function handleChatStream(messages: ChatMessage[], context: ChatContext, res: Response): Promise<void>;
export declare function handleChat(messages: ChatMessage[], context: ChatContext): Promise<{
    response: string;
    toolResults: ToolResult[];
}>;
