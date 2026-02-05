"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { findElement } from "./utils/treeUtils";
import { Button } from "./ui/Button";
import { DiamondsFourIcon } from "@phosphor-icons/react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/Tooltip";
export default function StylesPanel({ selectedElementId, elements, onUpdateElementStyles, onCreateComponent }) {
    const [cssText, setCssText] = useState('');
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    useEffect(() => {
        // Only sync from state when not actively editing
        if (isEditing)
            return;
        if (!selectedElementId) {
            setCssText('');
            return;
        }
        // Find the element in state
        const element = findElement(elements, selectedElementId);
        if (!element) {
            setCssText('');
            return;
        }
        // Convert element.styles to CSS text format
        const styles = element.styles || {};
        const cssStr = Object.entries(styles)
            .map(([key, value]) => `${camelToKebab(key)}: ${value};`)
            .join('\n');
        setCssText(cssStr);
    }, [selectedElementId, elements, isEditing]);
    const handleCssChange = (newCssText) => {
        setCssText(newCssText);
        setError('');
        if (!selectedElementId)
            return;
        // Parse CSS text into styles object
        try {
            const styles = {};
            const lines = newCssText.split('\n').filter(line => line.trim());
            for (const line of lines) {
                const colonIndex = line.indexOf(':');
                if (colonIndex === -1)
                    continue;
                const prop = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();
                // Remove trailing semicolon
                if (value.endsWith(';')) {
                    value = value.slice(0, -1).trim();
                }
                if (prop && value) {
                    // Convert kebab-case to camelCase
                    const camelProp = kebabToCamel(prop);
                    styles[camelProp] = value;
                }
            }
            onUpdateElementStyles(selectedElementId, styles);
        }
        catch (e) {
            setError('Invalid CSS format');
        }
    };
    if (!selectedElementId) {
        return (_jsx("div", { className: "h-full flex items-center justify-center text-sm text-ed-muted-foreground p-4", children: "Select an element to edit its styles" }));
    }
    const element = findElement(elements, selectedElementId);
    const elementType = element?.type === 'component'
        ? `Component: ${element.componentName}`
        : element?.type === 'html'
            ? `HTML: <${element.tag}>`
            : 'Text';
    return (_jsxs("div", { className: "h-full flex flex-col overflow-hidden", children: [_jsxs("div", { className: "border-b border-ed-border p-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-semibold text-ed-foreground", children: "Styles" }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "icon-sm", LeftIcon: DiamondsFourIcon, leftIconProps: { weight: "fill" }, isChildText: false, onClick: onCreateComponent, disabled: !onCreateComponent }) }), _jsx(TooltipContent, { children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { children: "Create Component" }), _jsx("span", { className: "opacity-60", children: "\u2325\u2318K" })] }) })] })] }), _jsx("p", { className: "text-xs text-ed-muted-foreground mt-1", children: elementType })] }), _jsxs("div", { className: "flex-1 overflow-auto p-3", children: [_jsx("textarea", { value: cssText, onChange: (e) => handleCssChange(e.target.value), onFocus: () => setIsEditing(true), onBlur: () => setIsEditing(false), onKeyDown: (e) => {
                            // Allow Enter key for newlines
                            if (e.key === 'Enter') {
                                e.stopPropagation();
                            }
                        }, className: "w-full h-full font-mono text-xs bg-ed-background border border-ed-border rounded p-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-ed-foreground placeholder:text-ed-muted-foreground", placeholder: "width: 100px;\nheight: 100px;\nbackground-color: blue;", spellCheck: false }), error && (_jsx("p", { className: "text-xs text-red-500 mt-2", children: error }))] }), _jsxs("div", { className: "border-t border-ed-border p-3 text-xs text-ed-muted-foreground", children: [_jsx("p", { children: "Edit CSS properties in the format:" }), _jsx("code", { className: "block mt-1 text-[10px] bg-ed-muted p-1 rounded text-ed-foreground", children: "property-name: value;" })] })] }));
}
// Helper functions
function camelToKebab(str) {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}
function kebabToCamel(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}
