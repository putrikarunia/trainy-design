import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect, useMemo, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Button } from './ui/Button';
import { PaperPlaneTilt, SpinnerGap, Robot, Plus, Pencil, Trash, CaretRight, Image as ImageIcon, File, SelectionBackground, FileCode, FolderOpen, MagnifyingGlass, FloppyDisk, ArrowsClockwise } from '@phosphor-icons/react';
// Simple markdown renderer for chat messages
function renderMarkdown(text) {
    const lines = text.split('\n');
    const elements = [];
    let inCodeBlock = false;
    let codeBlockContent = [];
    let codeBlockLang = '';
    const processInlineFormatting = (line, key) => {
        // Process inline code, bold, and regular text
        const parts = [];
        let remaining = line;
        let partIndex = 0;
        while (remaining.length > 0) {
            // Check for inline code first (backticks)
            const codeMatch = remaining.match(/^`([^`]+)`/);
            if (codeMatch) {
                parts.push(_jsx("code", { className: "bg-black/20 px-1 py-0.5 rounded text-xs font-mono", children: codeMatch[1] }, `${key}-${partIndex++}`));
                remaining = remaining.slice(codeMatch[0].length);
                continue;
            }
            // Check for bold (**text**)
            const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
            if (boldMatch) {
                parts.push(_jsx("strong", { children: boldMatch[1] }, `${key}-${partIndex++}`));
                remaining = remaining.slice(boldMatch[0].length);
                continue;
            }
            // Check for italic (*text* or _text_)
            const italicMatch = remaining.match(/^(\*|_)([^*_]+)\1/);
            if (italicMatch) {
                parts.push(_jsx("em", { children: italicMatch[2] }, `${key}-${partIndex++}`));
                remaining = remaining.slice(italicMatch[0].length);
                continue;
            }
            // Find the next special character or take one character
            const nextSpecial = remaining.search(/[`*_]/);
            if (nextSpecial === -1) {
                parts.push(remaining);
                break;
            }
            else if (nextSpecial === 0) {
                // Special char that didn't match a pattern, treat as text
                parts.push(remaining[0]);
                remaining = remaining.slice(1);
            }
            else {
                parts.push(remaining.slice(0, nextSpecial));
                remaining = remaining.slice(nextSpecial);
            }
        }
        return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : _jsx(_Fragment, { children: parts });
    };
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const key = `line-${i}`;
        // Code block start/end
        if (line.startsWith('```')) {
            if (inCodeBlock) {
                // End of code block
                elements.push(_jsx("pre", { className: "bg-black/30 rounded p-2 my-1 overflow-x-auto text-xs font-mono whitespace-pre-wrap", children: _jsx("code", { children: codeBlockContent.join('\n') }) }, key));
                inCodeBlock = false;
                codeBlockContent = [];
                codeBlockLang = '';
            }
            else {
                // Start of code block
                inCodeBlock = true;
                codeBlockLang = line.slice(3).trim();
            }
            continue;
        }
        if (inCodeBlock) {
            codeBlockContent.push(line);
            continue;
        }
        // Empty line
        if (!line.trim()) {
            elements.push(_jsx("div", { className: "h-2" }, key));
            continue;
        }
        // Headers
        if (line.startsWith('### ')) {
            elements.push(_jsx("div", { className: "font-semibold text-xs mt-2 mb-1", children: line.slice(4) }, key));
            continue;
        }
        if (line.startsWith('## ')) {
            elements.push(_jsx("div", { className: "font-semibold mt-2 mb-1", children: line.slice(3) }, key));
            continue;
        }
        if (line.startsWith('# ')) {
            elements.push(_jsx("div", { className: "font-bold mt-2 mb-1", children: line.slice(2) }, key));
            continue;
        }
        // List items
        if (line.match(/^[\-\*]\s/)) {
            elements.push(_jsxs("div", { className: "flex gap-1.5 ml-1", children: [_jsx("span", { className: "text-ed-muted-foreground", children: "\u2022" }), _jsx("span", { children: processInlineFormatting(line.slice(2), key) })] }, key));
            continue;
        }
        // Numbered list
        const numberedMatch = line.match(/^(\d+)\.\s(.*)/);
        if (numberedMatch) {
            elements.push(_jsxs("div", { className: "flex gap-1.5 ml-1", children: [_jsxs("span", { className: "text-ed-muted-foreground min-w-4", children: [numberedMatch[1], "."] }), _jsx("span", { children: processInlineFormatting(numberedMatch[2], key) })] }, key));
            continue;
        }
        // Regular paragraph with inline formatting
        elements.push(_jsx("div", { children: processInlineFormatting(line, key) }, key));
    }
    // Handle unclosed code block
    if (inCodeBlock && codeBlockContent.length > 0) {
        elements.push(_jsx("pre", { className: "bg-black/30 rounded p-2 my-1 overflow-x-auto text-xs font-mono whitespace-pre-wrap", children: _jsx("code", { children: codeBlockContent.join('\n') }) }, "unclosed-code"));
    }
    return _jsx("div", { className: "space-y-0.5", children: elements });
}
function findElementById(elements, id) {
    for (const el of elements) {
        if (el.id === id)
            return el;
        if ('children' in el && el.children) {
            const found = findElementById(el.children, id);
            if (found)
                return found;
        }
    }
    return null;
}
function generateMessageId() {
    return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function getElementLabel(el) {
    if (el.type === 'html') {
        const tag = el.tag || 'div';
        // If element has a name prop, show both tag and name
        const name = el.props?.name;
        return name ? `<${tag}> ${name}` : `<${tag}>`;
    }
    if (el.type === 'component')
        return el.componentName;
    if (el.type === 'text') {
        const text = (el.text || '').slice(0, 20);
        return text ? `"${text}${el.text && el.text.length > 20 ? '...' : ''}"` : 'Text';
    }
    if (el.type === 'icon')
        return el.iconName;
    return el.type;
}
function ToolResultCard({ result, elements, onSelect }) {
    const element = result.createdElementId ? findElementById(elements, result.createdElementId) : null;
    const payload = result.payload;
    const getIcon = () => {
        switch (result.type) {
            case 'add_jsx': return _jsx(Plus, { size: 12, weight: "bold" });
            case 'update_jsx': return _jsx(Pencil, { size: 12, weight: "bold" });
            case 'delete_element': return _jsx(Trash, { size: 12, weight: "bold" });
            case 'replace_with_component': return _jsx(ArrowsClockwise, { size: 12, weight: "bold" });
            case 'Read': return _jsx(FileCode, { size: 12, weight: "bold" });
            case 'Write': return _jsx(FloppyDisk, { size: 12, weight: "bold" });
            case 'LS': return _jsx(FolderOpen, { size: 12, weight: "bold" });
            case 'Glob': return _jsx(MagnifyingGlass, { size: 12, weight: "bold" });
            default: return _jsx(File, { size: 12 });
        }
    };
    const getLabel = () => {
        if (result.type === 'add_jsx') {
            const count = result.createdElementIds?.length || payload.elements?.length || 1;
            return count > 1 ? `${count} elements` : 'Element';
        }
        if (result.type === 'update_jsx') {
            if (element) {
                if (element.type === 'component')
                    return element.componentName;
                if (element.type === 'html')
                    return `<${element.tag}>`;
                return element.type;
            }
            return 'Element';
        }
        if (result.type === 'delete_element')
            return 'Element';
        if (result.type === 'replace_with_component')
            return payload.componentName || 'Component';
        if (result.type === 'Read')
            return payload.path || 'file';
        if (result.type === 'Write') {
            // Show component name if it was registered
            if (payload.componentRegistered)
                return payload.componentName;
            return payload.path || 'file';
        }
        if (result.type === 'LS')
            return payload.path || '.';
        if (result.type === 'Glob')
            return `${payload.files?.length || 0} files`;
        return 'Action';
    };
    const getAction = () => {
        switch (result.type) {
            case 'add_jsx': return 'Added';
            case 'update_jsx': return 'Updated';
            case 'delete_element': return 'Deleted';
            case 'replace_with_component': return 'Replaced with';
            case 'Read': return 'Read';
            case 'Write': return payload.componentRegistered ? 'Created' : (payload.success ? 'Wrote' : 'Failed');
            case 'LS': return 'Listed';
            case 'Glob': return 'Found';
            default: return '';
        }
    };
    const getStyle = () => {
        // File operations have different styling
        if (['Read', 'LS', 'Glob'].includes(result.type)) {
            if (payload.error) {
                return 'bg-red-500/10 text-red-600 cursor-default';
            }
            return 'bg-blue-500/10 text-blue-600 cursor-default';
        }
        // Write with component registered is special
        if (result.type === 'Write') {
            if (payload.error)
                return 'bg-red-500/10 text-red-600 cursor-default';
            if (payload.componentRegistered)
                return 'bg-green-500/10 text-green-600 cursor-default';
            return 'bg-blue-500/10 text-blue-600 cursor-default';
        }
        // Canvas operations
        const clickableId = result.createdElementId || (result.createdElementIds && result.createdElementIds[0]) ||
            (result.type === 'replace_with_component' && payload.elementId);
        const canClick = clickableId && result.type !== 'delete_element';
        return canClick
            ? 'bg-ed-primary/10 text-ed-primary hover:bg-ed-primary/20 cursor-pointer'
            : 'bg-ed-muted text-ed-muted-foreground cursor-default';
    };
    const clickableId = result.createdElementId || (result.createdElementIds && result.createdElementIds[0]) ||
        (result.type === 'replace_with_component' && payload.elementId);
    const canClick = clickableId && result.type !== 'delete_element' && !['Read', 'Write', 'LS', 'Glob'].includes(result.type);
    return (_jsxs("button", { onClick: () => canClick && clickableId && onSelect(clickableId), disabled: !canClick, className: `inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${getStyle()}`, children: [getIcon(), _jsxs("span", { className: "max-w-[150px] truncate", children: [getAction(), " ", getLabel()] }), canClick && _jsx(CaretRight, { size: 10 })] }));
}
function renderContentWithRefs(content, refs, role) {
    // Content has placeholders like [@name], replace with badges
    const parts = [];
    let lastIndex = 0;
    let refIndex = 0;
    const regex = /\[@([^\]]+)\]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
            parts.push(content.slice(lastIndex, match.index));
        }
        // Add badge for this ref
        const ref = refs[refIndex];
        if (ref) {
            parts.push(_jsxs("span", { className: `inline-flex items-center gap-1 text-xs font-medium rounded px-1.5 py-0.5 mx-0.5 align-middle ${role === 'user'
                    ? 'bg-ed-primary-foreground/20'
                    : 'text-ed-primary bg-ed-primary/10'}`, children: [ref.type === 'element' && _jsx(SelectionBackground, { size: 10 }), ref.type === 'image' && _jsx(ImageIcon, { size: 10 }), ref.type === 'file' && _jsx(File, { size: 10 }), _jsx("span", { className: "max-w-[100px] truncate", children: ref.name })] }, `ref-${refIndex}`));
            refIndex++;
        }
        lastIndex = regex.lastIndex;
    }
    // Add remaining text
    if (lastIndex < content.length) {
        parts.push(content.slice(lastIndex));
    }
    return _jsx(_Fragment, { children: parts });
}
function createRefBadgeHTML(ref) {
    const iconSvg = ref.type === 'element'
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256"><path d="M80,64a8,8,0,0,1,8-8H208a8,8,0,0,1,0,16H88A8,8,0,0,1,80,64Zm128,56H88a8,8,0,0,0,0,16H208a8,8,0,0,0,0-16Zm0,64H88a8,8,0,0,0,0,16H208a8,8,0,0,0,0-16ZM44,52A12,12,0,1,0,56,64,12,12,0,0,0,44,52Zm0,64a12,12,0,1,0,12,12A12,12,0,0,0,44,116Zm0,64a12,12,0,1,0,12,12A12,12,0,0,0,44,180Z"></path></svg>'
        : ref.type === 'image'
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256"><path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H216v96l-36.69-36.69a16,16,0,0,0-22.62,0L144,128,97.66,81.34a16,16,0,0,0-22.62,0L40,116.69V56Zm0,144V139.31l48-48L144,147.31ZM216,200H77.66l66.34-66.34L216,206V200Z"></path></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256"><path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z"></path></svg>';
    // Use actual colors (blue) instead of CSS variables which don't work in raw HTML
    return `<span contenteditable="false" data-ref-type="${ref.type}" data-ref-id="${ref.id}" data-ref-name="${ref.name}" style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:500;color:#2563eb;background-color:rgba(37,99,235,0.1);border-radius:4px;padding:2px 6px;margin:0 2px;vertical-align:middle;user-select:none;">${iconSvg}<span style="display:inline;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${ref.name}</span></span>`;
}
export const ChatPanel = forwardRef(function ChatPanel({ elements, selectedElementIds, availableComponents, devServerUrl, canvasId, messages, onMessagesChange, onToolResult, onSelectElement, iconLibraryName, }, ref) {
    const selectedElements = useMemo(() => {
        return Array.from(selectedElementIds)
            .map(id => findElementById(elements, id))
            .filter(Boolean);
    }, [elements, selectedElementIds]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
    const saveTimeoutRef = useRef(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);
    // Store image data separately (too large for DOM attributes)
    const imageDataMapRef = useRef(new Map());
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    // Load chat history on mount or canvas change
    useEffect(() => {
        if (!canvasId || !devServerUrl)
            return;
        const loadHistory = async () => {
            try {
                const response = await fetch(`${devServerUrl}/api/canvas/${canvasId}/chat`);
                const data = await response.json();
                if (data.success && data.messages) {
                    onMessagesChange(data.messages);
                }
            }
            catch (err) {
                console.error('Failed to load chat history:', err);
            }
            finally {
                setHasLoadedHistory(true);
            }
        };
        loadHistory();
    }, [canvasId, devServerUrl]);
    // Save chat history when messages change (debounced)
    useEffect(() => {
        if (!canvasId || !devServerUrl || !hasLoadedHistory)
            return;
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await fetch(`${devServerUrl}/api/canvas/${canvasId}/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages })
                });
            }
            catch (err) {
                console.error('Failed to save chat history:', err);
            }
        }, 500);
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [messages, canvasId, devServerUrl, hasLoadedHistory]);
    // Insert reference at cursor position
    const insertRefAtCursor = useCallback((ref) => {
        const input = inputRef.current;
        if (!input)
            return;
        // Store image data in map (too large for DOM attributes)
        if (ref.type === 'image' && ref.data) {
            imageDataMapRef.current.set(ref.id, ref.data);
        }
        input.focus();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            // No selection, append at end
            input.innerHTML += createRefBadgeHTML(ref) + '&nbsp;';
        }
        else {
            const range = selection.getRangeAt(0);
            // Check if cursor is inside our input
            if (input.contains(range.commonAncestorContainer)) {
                range.deleteContents();
                const temp = document.createElement('div');
                temp.innerHTML = createRefBadgeHTML(ref) + '&nbsp;';
                const frag = document.createDocumentFragment();
                while (temp.firstChild) {
                    frag.appendChild(temp.firstChild);
                }
                range.insertNode(frag);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            }
            else {
                input.innerHTML += createRefBadgeHTML(ref) + '&nbsp;';
            }
        }
    }, []);
    // Expose addSelectedElements method via ref (triggered by Cmd+L)
    useImperativeHandle(ref, () => ({
        addSelectedElements: () => {
            if (selectedElements.length === 0)
                return;
            const input = inputRef.current;
            selectedElements.forEach(el => {
                // Skip if already in input
                if (input?.querySelector(`[data-ref-id="${el.id}"]`))
                    return;
                insertRefAtCursor({
                    type: 'element',
                    id: el.id,
                    name: getElementLabel(el)
                });
            });
        }
    }), [selectedElements, insertRefAtCursor]);
    const handleFileUpload = (e, type) => {
        const files = e.target.files;
        if (!files)
            return;
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result;
                insertRefAtCursor({
                    type,
                    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    name: file.name,
                    data: base64
                });
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };
    // Parse contenteditable to get text and refs
    const parseInput = useCallback(() => {
        const input = inputRef.current;
        if (!input)
            return { text: '', refs: [] };
        const refs = [];
        let text = '';
        const walk = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent || '';
            }
            else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node;
                if (el.dataset.refId) {
                    const refId = el.dataset.refId;
                    const refType = el.dataset.refType;
                    refs.push({
                        type: refType,
                        id: refId,
                        name: el.dataset.refName || '',
                        // Include image data from our map
                        data: refType === 'image' ? imageDataMapRef.current.get(refId) : undefined
                    });
                    text += `[@${el.dataset.refName}]`;
                }
                else if (el.tagName === 'BR') {
                    text += '\n';
                }
                else {
                    el.childNodes.forEach(walk);
                }
            }
        };
        input.childNodes.forEach(walk);
        return { text: text.trim(), refs };
    }, []);
    const [streamingContent, setStreamingContent] = useState('');
    const handleSubmit = async () => {
        const { text, refs } = parseInput();
        if (!text && refs.length === 0)
            return;
        if (isLoading)
            return;
        const userMessage = {
            id: generateMessageId(),
            role: 'user',
            content: text,
            inlineRefs: refs.length > 0 ? refs : undefined
        };
        const newMessages = [...messages, userMessage];
        onMessagesChange(newMessages);
        // Clear input and image data map
        if (inputRef.current) {
            inputRef.current.innerHTML = '';
        }
        imageDataMapRef.current.clear();
        setIsLoading(true);
        setStreamingContent('');
        setError(null);
        try {
            const attachedElements = refs
                .filter(r => r.type === 'element')
                .map(r => findElementById(elements, r.id))
                .filter(Boolean);
            const inlineRefsForContext = refs.map(r => ({
                type: r.type,
                id: r.id,
                name: r.name,
                data: r.data
            }));
            const response = await fetch(`${devServerUrl}/api/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stream: true,
                    messages: newMessages
                        .filter(m => m.content || m.role === 'user')
                        .map(m => ({
                        role: m.role,
                        content: m.content || (m.toolResults ? '[Applied changes]' : '')
                    }))
                        .filter(m => m.content),
                    context: {
                        canvasElements: elements,
                        availableComponents,
                        selectedElementIds: Array.from(selectedElementIds),
                        selectedElements,
                        attachedElements,
                        inlineRefs: inlineRefsForContext,
                        iconLibraryName,
                    },
                }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to get response');
            }
            // Handle SSE streaming
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            let toolResultsWithIds = [];
            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                if (data.type === 'text') {
                                    fullText += data.content;
                                    setStreamingContent(fullText);
                                }
                                else if (data.type === 'tools') {
                                    // Process tool results
                                    for (const result of data.results || []) {
                                        const createdElementId = onToolResult(result);
                                        toolResultsWithIds.push({ ...result, createdElementId });
                                    }
                                }
                                else if (data.type === 'done') {
                                    // Streaming complete
                                    fullText = data.fullText || fullText;
                                }
                                else if (data.type === 'error') {
                                    throw new Error(data.message);
                                }
                            }
                            catch (e) {
                                // Ignore parse errors for partial chunks
                            }
                        }
                    }
                }
            }
            setStreamingContent('');
            const assistantMessage = {
                id: generateMessageId(),
                role: 'assistant',
                content: fullText,
                toolResults: toolResultsWithIds.length > 0 ? toolResultsWithIds : undefined,
            };
            onMessagesChange([...newMessages, assistantMessage]);
        }
        catch (err) {
            setStreamingContent('');
            setError(err instanceof Error ? err.message : 'Something went wrong');
        }
        finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };
    // Handle paste for screenshots
    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items)
            return;
        for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (!file)
                    continue;
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result;
                    insertRefAtCursor({
                        type: 'image',
                        id: `screenshot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                        name: 'Screenshot',
                        data: base64
                    });
                };
                reader.readAsDataURL(file);
                break;
            }
        }
    };
    // Handle drag & drop for images
    const handleDrop = (e) => {
        e.preventDefault();
        const files = e.dataTransfer?.files;
        if (!files)
            return;
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result;
                    insertRefAtCursor({
                        type: 'image',
                        id: `image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                        name: file.name,
                        data: base64
                    });
                };
                reader.readAsDataURL(file);
            }
        });
    };
    const handleDragOver = (e) => {
        e.preventDefault();
    };
    return (_jsxs("div", { className: "flex flex-col h-full bg-ed-background", children: [_jsxs("div", { className: "flex items-center gap-2 px-3 py-2 border-b border-ed-border", children: [_jsx(Robot, { size: 16, className: "text-ed-muted-foreground" }), _jsx("span", { className: "text-sm font-medium text-ed-foreground", children: "AI Assistant" }), messages.length > 0 && (_jsx("button", { onClick: async () => {
                            onMessagesChange([]);
                            if (canvasId && devServerUrl) {
                                try {
                                    await fetch(`${devServerUrl}/api/canvas/${canvasId}/chat`, { method: 'DELETE' });
                                }
                                catch (err) {
                                    console.error('Failed to clear chat history:', err);
                                }
                            }
                        }, className: "ml-auto text-xs text-ed-muted-foreground hover:text-ed-foreground", children: "Clear" }))] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-3 space-y-3", children: [messages.length === 0 && (_jsxs("div", { className: "text-center text-ed-muted-foreground text-sm py-8", children: [_jsx("p", { children: "Ask me to help with your design." }), _jsx("p", { className: "mt-2 text-xs", children: "Select elements to reference them in your message." })] })), messages.map((msg) => (_jsx("div", { className: `flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`, children: _jsxs("div", { className: `max-w-[85%] rounded-lg px-3 py-2 text-sm ${msg.role === 'user'
                                ? 'bg-ed-primary text-ed-primary-foreground'
                                : 'bg-ed-muted text-ed-foreground'}`, children: [msg.content && (_jsx("div", { children: msg.inlineRefs && msg.inlineRefs.length > 0
                                        ? renderContentWithRefs(msg.content, msg.inlineRefs, msg.role)
                                        : msg.role === 'assistant'
                                            ? renderMarkdown(msg.content)
                                            : msg.content })), msg.toolResults && msg.toolResults.length > 0 && (_jsx("div", { className: `flex flex-wrap gap-1.5 ${msg.content ? 'mt-2' : ''}`, children: msg.toolResults.map((result, i) => (_jsx(ToolResultCard, { result: result, elements: elements, onSelect: onSelectElement }, i))) }))] }) }, msg.id))), isLoading && (_jsx("div", { className: "flex justify-start", children: _jsx("div", { className: "bg-ed-muted rounded-lg px-3 py-2 max-w-[85%] text-ed-foreground", children: streamingContent ? (_jsxs("div", { className: "text-sm", children: [renderMarkdown(streamingContent), _jsx("span", { className: "animate-pulse", children: "\u258C" })] })) : (_jsx(SpinnerGap, { size: 16, className: "animate-spin" })) }) })), error && (_jsx("div", { className: "text-ed-destructive text-sm text-center py-2", children: error })), _jsx("div", { ref: messagesEndRef })] }), _jsx("div", { className: "p-3 border-t border-ed-border", children: _jsxs("div", { className: "border border-ed-border rounded-lg p-2 flex flex-col gap-2 bg-ed-background", children: [_jsx("div", { ref: inputRef, contentEditable: true, onKeyDown: handleKeyDown, onPaste: handlePaste, onDrop: handleDrop, onDragOver: handleDragOver, "data-placeholder": "Ask AI to help... (\u2318L to add selection)", className: "w-full min-h-[32px] max-h-[100px] overflow-y-auto bg-transparent text-sm text-ed-foreground focus:outline-none px-1 empty:before:content-[attr(data-placeholder)] empty:before:text-ed-muted-foreground/50" }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Button, { variant: "outline", size: "icon", className: "h-7 w-7", onClick: () => imageInputRef.current?.click(), children: _jsx(ImageIcon, { size: 16, className: "text-ed-muted-foreground" }) }), _jsx("input", { ref: imageInputRef, type: "file", accept: "image/*", multiple: true, className: "hidden", onChange: (e) => handleFileUpload(e, 'image') }), _jsx(Button, { variant: "outline", size: "icon", className: "h-7 w-7", onClick: () => fileInputRef.current?.click(), children: _jsx(File, { size: 16, className: "text-ed-muted-foreground" }) }), _jsx("input", { ref: fileInputRef, type: "file", multiple: true, className: "hidden", onChange: (e) => handleFileUpload(e, 'file') })] }), _jsx(Button, { size: "icon", className: "h-7 w-7", onClick: handleSubmit, disabled: isLoading, children: _jsx(PaperPlaneTilt, { size: 14 }) })] })] }) })] }));
});
