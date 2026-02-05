"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { PHOSPHOR_PROPS_SCHEMA, LUCIDE_PROPS_SCHEMA, VIEWPORT_PRESETS } from "./types";
import { findElement } from "./utils/treeUtils";
import { getDeviceNameForWidth } from "./ViewportRenderer";
import { Text } from "./ui/Text";
import { Input } from "./ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "./ui/Select";
import { htmlPropsSchema } from "@lunagraph/codegen";
import { DiamondIcon, X } from "@phosphor-icons/react";
// Default schema for unknown icon libraries
const DEFAULT_ICON_PROPS_SCHEMA = {
    size: { type: 'number', default: 16, label: 'Size' },
    color: { type: 'color', label: 'Color' },
};
// Get schema for a library (try to detect common libraries)
function getIconPropsSchema(libraryName, config) {
    if (config?.propsSchema)
        return config.propsSchema;
    if (libraryName.includes('phosphor'))
        return PHOSPHOR_PROPS_SCHEMA;
    if (libraryName.includes('lucide'))
        return LUCIDE_PROPS_SCHEMA;
    return DEFAULT_ICON_PROPS_SCHEMA;
}
const COMPONENT_HINT_DISMISSED_KEY = 'lunagraph-component-hint-dismissed';
export default function PropsPanel({ selectedElementId, elements, componentIndex, iconLibraries, onUpdateElementProps, onReplaceElement, onOpenComponent, renderMode = 'felement', readOnly = false, }) {
    const [propValues, setPropValues] = useState({});
    const [viewportValues, setViewportValues] = useState({
        width: '',
        height: '',
        deviceName: '',
    });
    const [componentHintDismissed, setComponentHintDismissed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(COMPONENT_HINT_DISMISSED_KEY) === 'true';
        }
        return false;
    });
    const handleDismissComponentHint = () => {
        setComponentHintDismissed(true);
        localStorage.setItem(COMPONENT_HINT_DISMISSED_KEY, 'true');
    };
    useEffect(() => {
        if (!selectedElementId) {
            setPropValues({});
            setViewportValues({ width: '', height: '', deviceName: '' });
            return;
        }
        const element = findElement(elements, selectedElementId);
        if (!element) {
            setPropValues({});
            setViewportValues({ width: '', height: '', deviceName: '' });
            return;
        }
        // Handle viewport elements separately
        if (element.type === 'viewport') {
            const viewportEl = element;
            setViewportValues({
                width: String(viewportEl.viewportWidth),
                height: viewportEl.viewportHeight ? String(viewportEl.viewportHeight) : '',
                deviceName: viewportEl.deviceName || '',
            });
            setPropValues({});
            return;
        }
        if (element.type !== 'component' && element.type !== 'icon' && element.type !== 'html') {
            setPropValues({});
            return;
        }
        // Initialize prop values from element.props
        const currentProps = element.props || {};
        // Convert all values to strings for input fields
        const stringValues = {};
        Object.entries(currentProps).forEach(([key, value]) => {
            // Skip style and className - they're handled separately
            if (key === 'style' || key === 'className')
                return;
            stringValues[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
        });
        setPropValues(stringValues);
    }, [selectedElementId, elements]);
    if (!selectedElementId) {
        return null;
    }
    const element = findElement(elements, selectedElementId);
    if (!element) {
        return null;
    }
    // Handle viewport elements
    if (element.type === 'viewport') {
        const viewportElement = element;
        const handleViewportChange = (field, value) => {
            if (!onReplaceElement)
                return;
            let newWidth = viewportElement.viewportWidth;
            let newHeight = viewportElement.viewportHeight;
            let newDeviceName = viewportElement.deviceName;
            if (field === 'width') {
                newWidth = parseInt(value) || viewportElement.viewportWidth;
                // Auto-update deviceName only if it wasn't explicitly set (empty or matches auto-detected name)
                const currentAutoName = getDeviceNameForWidth(viewportElement.viewportWidth);
                if (!viewportElement.deviceName || viewportElement.deviceName === currentAutoName) {
                    newDeviceName = ''; // Clear it so it auto-detects in ViewportRenderer
                }
            }
            else if (field === 'height') {
                newHeight = value ? parseInt(value) : undefined;
            }
            else if (field === 'deviceName') {
                newDeviceName = value;
            }
            setViewportValues({
                width: String(newWidth),
                height: newHeight ? String(newHeight) : '',
                deviceName: newDeviceName || '',
            });
            const updatedElement = {
                ...viewportElement,
                viewportWidth: newWidth,
                viewportHeight: newHeight,
                deviceName: newDeviceName || undefined,
            };
            onReplaceElement(selectedElementId, updatedElement);
        };
        const handlePresetChange = (presetKey) => {
            const preset = VIEWPORT_PRESETS[presetKey];
            if (!preset || !onReplaceElement)
                return;
            setViewportValues({
                width: String(preset.width),
                height: String(preset.height),
                deviceName: preset.name,
            });
            const updatedElement = {
                ...viewportElement,
                viewportWidth: preset.width,
                viewportHeight: preset.height,
                deviceName: preset.name,
            };
            onReplaceElement(selectedElementId, updatedElement);
        };
        return (_jsxs("div", { className: "border-b border-ed-border", children: [_jsxs("div", { className: "p-3 border-b border-ed-border", children: [_jsx(Text, { size: "sm", weight: "semibold", children: "Viewport" }), _jsxs(Text, { size: "xs", variant: "tertiary", className: "mt-1", children: [viewportElement.deviceName || 'Custom', " (", viewportElement.viewportWidth, "px)"] })] }), _jsxs("div", { className: "p-3 space-y-3", children: [_jsxs("div", { children: [_jsx(Text, { size: "xs", weight: "medium", className: "mb-1 block", children: "Preset" }), _jsxs(Select, { value: "", onValueChange: handlePresetChange, children: [_jsx(SelectTrigger, { className: "w-full h-8 text-xs", children: _jsx(SelectValue, { placeholder: "Choose a preset..." }) }), _jsx(SelectContent, { children: Object.entries(VIEWPORT_PRESETS).map(([key, preset]) => (_jsxs(SelectItem, { value: key, children: [preset.name, " (", preset.width, "\u00D7", preset.height, ")"] }, key))) })] })] }), _jsxs("div", { children: [_jsx(Text, { size: "xs", weight: "medium", className: "mb-1 block", children: "Width (px)" }), _jsx(Input, { type: "number", value: viewportValues.width, onChange: (e) => handleViewportChange('width', e.target.value), onKeyDown: (e) => e.stopPropagation(), className: "w-full h-8 text-xs", placeholder: "1512", min: 100 })] }), _jsxs("div", { children: [_jsx(Text, { size: "xs", weight: "medium", className: "mb-1 block", children: "Height (px)" }), _jsx(Input, { type: "number", value: viewportValues.height, onChange: (e) => handleViewportChange('height', e.target.value), onKeyDown: (e) => e.stopPropagation(), className: "w-full h-8 text-xs", placeholder: "auto", min: 100 }), _jsx(Text, { size: "3xs", variant: "tertiary", className: "mt-0.5", children: "Leave empty for auto height" })] }), _jsxs("div", { children: [_jsx(Text, { size: "xs", weight: "medium", className: "mb-1 block", children: "Label" }), _jsx(Input, { type: "text", value: viewportValues.deviceName, onChange: (e) => handleViewportChange('deviceName', e.target.value), onKeyDown: (e) => e.stopPropagation(), className: "w-full h-8 text-xs", placeholder: "Desktop, Mobile, etc." })] })] })] }));
    }
    // For other types, check if they have editable props
    if (element.type !== 'component' && element.type !== 'icon' && element.type !== 'html') {
        return null;
    }
    const handlePropChange = (propName, value, propType) => {
        setPropValues(prev => ({ ...prev, [propName]: value }));
        // Parse value and update element props
        let parsedValue = value;
        // Handle specific prop types
        if (propType === 'number') {
            parsedValue = value === '' ? undefined : Number(value);
        }
        else if (propType === 'boolean') {
            parsedValue = value === 'true';
        }
        else if (value.startsWith('{') || value.startsWith('[')) {
            try {
                // First try strict JSON
                parsedValue = JSON.parse(value);
            }
            catch {
                // If JSON fails, try evaluating as JavaScript (handles single quotes, unquoted keys)
                try {
                    // Use Function constructor to safely evaluate JS object/array literals
                    // This handles: { label: 'test' } and ['a', 'b']
                    parsedValue = new Function(`return ${value}`)();
                }
                catch {
                    // Keep as string if both fail
                }
            }
        }
        else if (value === 'true') {
            parsedValue = true;
        }
        else if (value === 'false') {
            parsedValue = false;
        }
        else if (!isNaN(Number(value)) && value !== '') {
            parsedValue = Number(value);
        }
        const newProps = {
            ...element.props,
            [propName]: parsedValue,
        };
        onUpdateElementProps(selectedElementId, newProps);
    };
    // Handle icon elements
    if (element.type === 'icon') {
        const iconElement = element;
        const libraryConfig = iconLibraries?.[iconElement.library];
        const schema = getIconPropsSchema(iconElement.library, libraryConfig);
        return (_jsxs("div", { className: "border-b border-ed-border", children: [_jsxs("div", { className: "p-3 border-b border-ed-border", children: [_jsx(Text, { size: "sm", weight: "semibold", children: "Icon" }), _jsx(Text, { size: "xs", variant: "tertiary", className: "mt-1", children: iconElement.iconName }), _jsx(Text, { size: "3xs", variant: "tertiary", children: libraryConfig?.displayName || iconElement.library })] }), _jsx("div", { className: "p-3 space-y-3 max-h-[300px] overflow-auto", children: Object.entries(schema).map(([propName, propConfig]) => {
                        const currentValue = propValues[propName] ?? String(propConfig.default ?? '');
                        if (propConfig.type === 'enum' && propConfig.options) {
                            return (_jsxs("div", { children: [_jsx(Text, { size: "xs", weight: "medium", className: "mb-1 block", children: propConfig.label || propName }), _jsxs(Select, { value: currentValue, onValueChange: (value) => handlePropChange(propName, value), children: [_jsx(SelectTrigger, { className: "w-full h-8 text-xs", children: _jsx(SelectValue, { placeholder: `Select ${propName}` }) }), _jsx(SelectContent, { children: propConfig.options.map((option) => (_jsx(SelectItem, { value: option, children: option }, option))) })] })] }, propName));
                        }
                        if (propConfig.type === 'boolean') {
                            return (_jsxs("div", { children: [_jsx(Text, { size: "xs", weight: "medium", className: "mb-1 block", children: propConfig.label || propName }), _jsxs(Select, { value: currentValue, onValueChange: (value) => handlePropChange(propName, value, 'boolean'), children: [_jsx(SelectTrigger, { className: "w-full h-8 text-xs", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "false", children: "false" }), _jsx(SelectItem, { value: "true", children: "true" })] })] })] }, propName));
                        }
                        if (propConfig.type === 'color') {
                            return (_jsxs("div", { children: [_jsx(Text, { size: "xs", weight: "medium", className: "mb-1 block", children: propConfig.label || propName }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "color", value: currentValue || '#000000', onChange: (e) => handlePropChange(propName, e.target.value), className: "w-8 h-8 rounded border border-ed-border cursor-pointer" }), _jsx(Input, { type: "text", value: currentValue, onChange: (e) => handlePropChange(propName, e.target.value), onKeyDown: (e) => e.stopPropagation(), className: "flex-1 h-8 text-xs", placeholder: "#000000" })] })] }, propName));
                        }
                        // Default: number or string input
                        return (_jsxs("div", { children: [_jsx(Text, { size: "xs", weight: "medium", className: "mb-1 block", children: propConfig.label || propName }), _jsx(Input, { type: propConfig.type === 'number' ? 'number' : 'text', step: propConfig.type === 'number' ? 'any' : undefined, value: currentValue, onChange: (e) => handlePropChange(propName, e.target.value, propConfig.type), onKeyDown: (e) => e.stopPropagation(), className: "w-full h-8 text-xs", placeholder: String(propConfig.default ?? '') })] }, propName));
                    }) })] }));
    }
    // Handle HTML elements (img, a, input, etc.)
    if (element.type === 'html') {
        const htmlElement = element;
        const tag = htmlElement.tag;
        // Use shared schema for HTML element props
        const propsForTag = htmlPropsSchema[tag] || [];
        if (propsForTag.length === 0) {
            return null;
        }
        return (_jsxs("div", { className: "border-b border-ed-border", children: [_jsxs("div", { className: "p-3 border-b border-ed-border", children: [_jsx(Text, { size: "sm", weight: "semibold", children: "Attributes" }), _jsxs(Text, { size: "xs", variant: "tertiary", className: "mt-1", children: ["<", tag, ">"] })] }), _jsx("div", { className: "p-3 space-y-3 max-h-[300px] overflow-auto", children: propsForTag.map((propConfig) => {
                        const propName = propConfig.label;
                        const currentValue = propValues[propName] ?? '';
                        if (propConfig.type === 'boolean') {
                            return (_jsxs("div", { children: [_jsx(Text, { size: "xs", weight: "medium", className: "mb-1 block", children: propName }), _jsxs(Select, { value: currentValue || 'false', onValueChange: (value) => handlePropChange(propName, value, 'boolean'), children: [_jsx(SelectTrigger, { className: "w-full h-8 text-xs", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "false", children: "false" }), _jsx(SelectItem, { value: "true", children: "true" })] })] })] }, propName));
                        }
                        // Special handling for img src - show preview
                        if (tag === 'img' && propName === 'src' && currentValue) {
                            return (_jsxs("div", { children: [_jsx(Text, { size: "xs", weight: "medium", className: "mb-1 block", children: propName }), currentValue.startsWith('data:') ? (_jsx("div", { className: "mb-2 p-2 bg-ed-muted rounded border border-ed-border", children: _jsx("img", { src: currentValue, alt: "Preview", className: "max-w-full max-h-24 object-contain mx-auto" }) })) : null, _jsx(Input, { type: "text", value: currentValue, onChange: (e) => handlePropChange(propName, e.target.value), onKeyDown: (e) => e.stopPropagation(), className: "w-full h-8 text-xs", placeholder: "https://..." })] }, propName));
                        }
                        return (_jsxs("div", { children: [_jsx(Text, { size: "xs", weight: "medium", className: "mb-1 block", children: propName }), _jsx(Input, { type: propConfig.type === 'number' ? 'number' : 'text', value: currentValue, onChange: (e) => handlePropChange(propName, e.target.value, propConfig.type), onKeyDown: (e) => e.stopPropagation(), className: "w-full h-8 text-xs" })] }, propName));
                    }) })] }));
    }
    // Handle component elements
    const componentElement = element;
    const componentName = componentElement.componentName;
    const componentInfo = componentIndex?.[componentName];
    const componentFilePath = componentInfo?.path;
    const availableProps = componentInfo?.props || {};
    // Filter out style and className props
    const editableProps = Object.entries(availableProps).filter(([key]) => key !== 'style' && key !== 'className');
    return (_jsxs("div", { children: [!componentHintDismissed && componentFilePath && (_jsxs("div", { className: "mx-3 mt-3 mb-2 p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800 flex items-start gap-2", children: [_jsx(DiamondIcon, { size: 14, weight: "bold", className: "text-purple-500 shrink-0 mt-0.5" }), _jsx(Text, { size: "xs", className: "text-purple-700 dark:text-purple-300 flex-1", children: "Double-click this component to open the main component file" }), _jsx("button", { onClick: handleDismissComponentHint, className: "shrink-0 p-0.5 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded text-purple-500 dark:text-purple-400", children: _jsx(X, { size: 14, weight: "bold" }) })] })), editableProps.length > 0 && (_jsxs("div", { className: "border-b border-ed-border", children: [_jsxs("div", { className: "p-3 border-b border-ed-border", children: [_jsx(Text, { size: "sm", weight: "semibold", children: "Props" }), _jsx(Text, { size: "xs", variant: "tertiary", className: "mt-1", children: componentName })] }), renderMode === 'snapshot' ? (_jsx("div", { className: "p-3", children: _jsx("p", { className: "text-xs text-ed-muted-foreground", children: "Props editing disabled in read-only mode" }) })) : (_jsx("div", { className: "p-3 space-y-3 max-h-[300px] overflow-auto", children: editableProps.map(([propName, propInfo]) => {
                            const isRequired = propInfo.required;
                            const propType = propInfo.type || 'string';
                            const currentValue = propValues[propName] || '';
                            return (_jsxs("div", { children: [_jsxs(Text, { size: "xs", weight: "medium", className: "mb-1 block", children: [propName, isRequired && _jsx("span", { className: "text-red-500 ml-1", children: "*" })] }), _jsx(Input, { type: "text", value: currentValue, onChange: (e) => handlePropChange(propName, e.target.value), onKeyDown: (e) => e.stopPropagation(), className: "w-full h-8 text-xs", placeholder: propType }), _jsx(Text, { size: "3xs", variant: "tertiary", className: "mt-0.5", children: propType })] }, propName));
                        }) }))] }))] }));
}
