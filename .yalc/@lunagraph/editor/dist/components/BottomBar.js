import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { generateCompleteFile } from '@lunagraph/codegen';
import { Button } from './ui/Button';
import { Text } from './ui/Text';
import { Tabs, TabsList, TabsTrigger } from './ui/Tabs';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { FloppyDisk, Trash, Cursor, FileTs } from '@phosphor-icons/react';
import { Badge } from './ui/Badge';
import { useDevServer } from '../hooks/useDevServer';
import { useState, useEffect, useMemo, useRef } from 'react';
import { findElement } from './utils/treeUtils';
import { githubLight } from '@uiw/codemirror-theme-github';
export function BottomBar({ tab, onSaveSuccess, onDiscardDraft, readOnly = false, selectedElementId, elements, componentIndex }) {
    const { saveFile, loadFile, isSaving, error } = useDevServer();
    const [saveStatus, setSaveStatus] = useState('idle');
    const [activeCodeTab, setActiveCodeTab] = useState('selection');
    const [sourceCode, setSourceCode] = useState('');
    const [isLoadingSource, setIsLoadingSource] = useState(false);
    // Check if we're editing a component (file tab)
    const isEditingComponent = tab.type === 'file' && tab.filePath;
    // Generate code for selected element (with imports for Create Component)
    const selectedElementCode = useMemo(() => {
        if (!selectedElementId) {
            return '// Select an element to see its code';
        }
        const selectedElement = findElement(elements, selectedElementId);
        if (!selectedElement) {
            return '// Element not found';
        }
        // Generate complete file with imports
        const code = generateCompleteFile({
            componentName: 'NewComponent',
            elements: [selectedElement],
            componentIndex,
            includeReactImport: false
        });
        return code;
    }, [selectedElementId, elements, componentIndex]);
    // Load source code when editing a component
    // Track which file we've loaded to prevent re-fetching
    const loadedFileRef = useRef(null);
    useEffect(() => {
        if (!isEditingComponent || !tab.filePath) {
            setSourceCode('');
            loadedFileRef.current = null;
            return;
        }
        // Skip if we've already loaded this file
        if (loadedFileRef.current === tab.filePath) {
            return;
        }
        // Use pre-loaded source code if available (for read-only mode)
        if (tab.sourceCode) {
            loadedFileRef.current = tab.filePath;
            setSourceCode(tab.sourceCode);
            return;
        }
        const loadSourceCode = async () => {
            setIsLoadingSource(true);
            loadedFileRef.current = tab.filePath;
            try {
                const result = await loadFile(tab.filePath);
                if (result.success && result.raw) {
                    setSourceCode(result.raw);
                }
                else {
                    setSourceCode('// Failed to load source code');
                }
            }
            catch {
                setSourceCode('// Error loading source code');
            }
            finally {
                setIsLoadingSource(false);
            }
        };
        loadSourceCode();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab.filePath, tab.sourceCode, isEditingComponent]);
    const handleSave = async () => {
        if (tab.type !== 'file' || !tab.filePath) {
            return;
        }
        // Determine the actual file path (for internal components, use parentFilePath)
        const actualFilePath = tab.isInternalComponent && tab.parentFilePath
            ? tab.parentFilePath
            : tab.filePath;
        const result = await saveFile({
            filePath: actualFilePath,
            elements: tab.elements,
            stateContext: tab.mockValues, // Pass mock values to help Claude understand snapshot context
            // For internal components, include the range to update only that portion
            internalComponent: tab.isInternalComponent ? {
                name: tab.internalComponentName,
                startLine: tab.internalComponentRange.startLine,
                endLine: tab.internalComponentRange.endLine,
            } : undefined,
        });
        if (result.success) {
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 2000);
            // Reload the file to get updated content
            // For internal components, we pass the parent file path so it refreshes
            if (onSaveSuccess) {
                onSaveSuccess(actualFilePath);
            }
        }
        else {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };
    const canSave = !readOnly && tab.type === 'file' && tab.filePath;
    // Get code for current active tab
    const currentCode = activeCodeTab === 'selection' ? selectedElementCode : sourceCode;
    return (_jsxs("div", { className: "h-full flex flex-col border-t border-ed-border bg-ed-background", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-ed-border bg-ed-muted/30 px-2 py-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Tabs, { value: activeCodeTab, onValueChange: (v) => setActiveCodeTab(v), children: _jsxs(TabsList, { variant: "simple", className: "h-7 gap-0 border-0", children: [_jsxs(TabsTrigger, { value: "selection", className: "text-xs px-3 py-1 h-6 gap-1.5", children: [_jsx(Cursor, { size: 12, weight: "bold" }), "Selection"] }), isEditingComponent && (_jsxs(TabsTrigger, { value: "source", className: "text-xs px-3 py-1 h-6 gap-1.5", children: [_jsx(FileTs, { size: 12, weight: "bold" }), "Source"] }))] }) }), activeCodeTab === 'source' && tab.filePath && (_jsx(Badge, { variant: "secondary", className: "text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", children: tab.filePath }))] }), _jsxs("div", { className: "flex items-center gap-2", children: [error && saveStatus === 'error' && (_jsx(Text, { size: "xs", className: "text-red-600", children: error })), saveStatus === 'success' && (_jsx(Text, { size: "xs", className: "text-green-600", children: "Saved!" })), canSave && tab.hasUnsavedChanges && onDiscardDraft && (_jsx(Button, { variant: "ghost", size: "xs", onClick: onDiscardDraft, disabled: isSaving, LeftIcon: Trash, children: "Discard draft" })), canSave && (_jsx(Button, { variant: "default", size: "xs", onClick: handleSave, disabled: isSaving, LeftIcon: FloppyDisk, leftIconProps: { weight: "fill" }, children: isSaving ? 'Saving...' : 'Save to code' })), _jsx(Button, { variant: "ghost", size: "xs", onClick: () => navigator.clipboard.writeText(currentCode), children: "Copy" })] })] }), _jsx("div", { className: "flex-1 overflow-auto", children: isLoadingSource && activeCodeTab === 'source' ? (_jsx("div", { className: "flex items-center justify-center h-full", children: _jsx(Text, { size: "sm", className: "text-ed-muted-foreground", children: "Loading source..." }) })) : (_jsx(CodeMirror, { value: currentCode || '// No code to display', height: "100%", extensions: [javascript({ jsx: true })], editable: false, theme: githubLight, basicSetup: {
                        lineNumbers: true,
                        highlightActiveLineGutter: false,
                        highlightActiveLine: false,
                        foldGutter: false,
                    } })) })] }));
}
