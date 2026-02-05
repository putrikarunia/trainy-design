import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Text } from "./ui/Text";
import { useState, useEffect } from "react";
export function StatePanel({ variables, mockValues, initialValues, props, onUpdateMockValue, readOnly = false, }) {
    // Filter out components (uppercase names that are likely React components/icons)
    // Only show actual props and state variables
    const displayVariables = variables.filter(varName => {
        // Keep props always
        if (props.includes(varName))
            return true;
        // Filter out uppercase names (likely components/icons like Card, SourceCard, IconTrendingUp)
        if (/^[A-Z]/.test(varName))
            return false;
        return true;
    });
    if (displayVariables.length === 0) {
        return (_jsx("div", { className: "h-full flex items-center justify-center p-4", children: _jsx(Text, { size: "sm", variant: "secondary", children: "No state to edit (free canvas)" }) }));
    }
    return (_jsxs("div", { className: "h-full flex flex-col overflow-hidden", children: [_jsxs("div", { className: "p-3 border-b border-ed-border flex flex-col", children: [_jsx(Text, { size: "sm", weight: "medium", children: "Current State" }), _jsx(Text, { size: "xs", variant: "secondary", className: "mt-1", children: "Edit mock values to see different renders" })] }), _jsx("div", { className: "flex-1 overflow-auto p-3 space-y-3", children: displayVariables.map((varName) => {
                    const value = mockValues[varName];
                    const isProp = props.includes(varName);
                    const hasInitialValue = varName in initialValues;
                    return (_jsx(VariableEditor, { name: varName, value: value, isProp: isProp, hasInitialValue: hasInitialValue, onChange: (newValue) => onUpdateMockValue(varName, newValue) }, varName));
                }) })] }));
}
function VariableEditor({ name, value, isProp, hasInitialValue, onChange }) {
    const [editingJson, setEditingJson] = useState(false);
    const [jsonError, setJsonError] = useState(null);
    const [jsonText, setJsonText] = useState('');
    const [nullText, setNullText] = useState('null');
    const [undefinedText, setUndefinedText] = useState('');
    const valueType = typeof value;
    const isArray = Array.isArray(value);
    const isObject = valueType === 'object' && value !== null && !isArray;
    const isComplex = isArray || isObject;
    // Props are always editable, even without initial values
    const isEditable = isProp || hasInitialValue;
    // Update local JSON text when value changes externally
    useEffect(() => {
        setJsonText(JSON.stringify(value, null, 2));
    }, [value]);
    // Update null text when value changes
    useEffect(() => {
        if (value === null) {
            setNullText('null');
        }
    }, [value]);
    const handleJsonChange = (text) => {
        setJsonText(text);
        setJsonError(null);
    };
    const handleJsonBlur = () => {
        try {
            const parsed = JSON.parse(jsonText);
            onChange(parsed);
            setJsonError(null);
        }
        catch (e) {
            setJsonError(e instanceof Error ? e.message : 'Invalid JSON');
        }
    };
    const handleNullChange = (text) => {
        setNullText(text);
    };
    const handleNullBlur = () => {
        const trimmed = nullText.trim();
        if (!trimmed) {
            setNullText('null');
            return;
        }
        try {
            const parsed = JSON.parse(trimmed);
            onChange(parsed);
        }
        catch {
            // If not valid JSON, treat as string
            onChange(trimmed);
        }
    };
    return (_jsxs("div", { className: "space-y-1.5", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Text, { size: "xs", weight: "medium", className: "font-mono", children: name }), isProp && (_jsx("span", { className: "px-1.5 py-0.5 rounded text-[10px] bg-ed-primary/10 text-ed-primary font-medium", children: "prop" })), !isEditable && (_jsx("span", { className: "px-1.5 py-0.5 rounded text-[10px] bg-ed-muted text-ed-muted-foreground font-medium", children: "computed" })), isComplex && isEditable && (_jsx("button", { onClick: () => setEditingJson(!editingJson), className: "ml-auto text-xs text-ed-primary hover:underline", children: editingJson ? 'Use UI' : 'Edit JSON' }))] }), valueType === 'string' && !editingJson && (_jsx("input", { type: "text", value: value, onChange: (e) => onChange(e.target.value), disabled: !isEditable, className: "w-full px-2 py-1.5 text-sm border border-ed-border rounded bg-ed-background text-ed-foreground focus:outline-none focus:ring-2 focus:ring-ed-ring disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-ed-muted-foreground", placeholder: name })), valueType === 'number' && !editingJson && (_jsx("input", { type: "number", value: value, onChange: (e) => onChange(parseFloat(e.target.value) || 0), disabled: !isEditable, className: "w-full px-2 py-1.5 text-sm border border-ed-border rounded bg-ed-background text-ed-foreground focus:outline-none focus:ring-2 focus:ring-ed-ring disabled:opacity-60 disabled:cursor-not-allowed" })), valueType === 'boolean' && !editingJson && (_jsxs("label", { className: `flex items-center gap-2 ${isEditable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`, children: [_jsx("input", { type: "checkbox", checked: value, onChange: (e) => onChange(e.target.checked), disabled: !isEditable, className: "w-4 h-4 rounded border-ed-border disabled:cursor-not-allowed" }), _jsx(Text, { size: "xs", variant: "secondary", children: value ? 'true' : 'false' })] })), (isComplex || editingJson) && (_jsxs("div", { className: "space-y-1", children: [_jsx("textarea", { value: jsonText, onChange: (e) => handleJsonChange(e.target.value), onBlur: handleJsonBlur, disabled: !isEditable, className: "w-full px-2 py-1.5 text-xs font-mono border border-ed-border rounded bg-ed-background focus:outline-none focus:ring-2 focus:ring-ed-ring resize-none disabled:opacity-60 disabled:cursor-not-allowed", rows: Math.min(jsonText.split('\n').length, 8), placeholder: isArray ? '[]' : '{}' }), jsonError && (_jsx(Text, { size: "xs", className: "text-red-600", children: jsonError }))] })), value === null && (_jsx("input", { type: "text", value: nullText, onChange: (e) => handleNullChange(e.target.value), onBlur: handleNullBlur, disabled: !isEditable, className: "w-full px-2 py-1.5 text-sm font-mono border border-ed-border rounded bg-ed-background text-ed-foreground focus:outline-none focus:ring-2 focus:ring-ed-ring disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-ed-muted-foreground", placeholder: "null (or type a value)" })), valueType === 'function' && (_jsxs("div", { className: "px-2 py-1.5 text-xs font-mono text-ed-muted-foreground border border-ed-border rounded bg-ed-muted/30", children: ["() => ", '{', "...", '}'] })), value === undefined && (_jsx("input", { type: "text", value: undefinedText, onChange: (e) => setUndefinedText(e.target.value), onBlur: () => {
                    const text = undefinedText.trim();
                    if (!text)
                        return;
                    // Try to parse as JSON first, otherwise treat as string
                    try {
                        const parsed = JSON.parse(text);
                        onChange(parsed);
                    }
                    catch {
                        onChange(text);
                    }
                }, disabled: !isEditable, className: "w-full px-2 py-1.5 text-sm border border-ed-border rounded bg-ed-background text-ed-foreground focus:outline-none focus:ring-2 focus:ring-ed-ring disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-ed-muted-foreground", placeholder: `Enter value for ${name}` }))] }));
}
