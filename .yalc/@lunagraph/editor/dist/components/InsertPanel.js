import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { MagnifyingGlassIcon, TextT, DeviceMobile, DeviceTablet, Desktop, Browser } from "@phosphor-icons/react";
import { Text } from "./ui/Text";
import { VIEWPORT_PRESETS } from "./types";
import { htmlTags, createElementFromTag } from "./htmlTagsData";
import { InsertItem } from "./InsertItem";
import { generatePrefixedId } from "./utils/idUtils";
// Viewport preset data for the insert panel
const viewportPresets = [
    {
        key: 'desktop',
        title: 'Desktop',
        description: 'Large screen viewport (1512px)',
        icon: Desktop,
        color: '#3b82f6',
        ...VIEWPORT_PRESETS.desktop,
    },
    {
        key: 'laptop',
        title: 'Laptop',
        description: 'Medium screen viewport (1280px)',
        icon: Browser,
        color: '#8b5cf6',
        ...VIEWPORT_PRESETS.laptop,
    },
    {
        key: 'tablet',
        title: 'Tablet',
        description: 'Tablet viewport (768px)',
        icon: DeviceTablet,
        color: '#10b981',
        ...VIEWPORT_PRESETS.tablet,
    },
    {
        key: 'mobile',
        title: 'Mobile',
        description: 'Mobile viewport (390px)',
        icon: DeviceMobile,
        color: '#f59e0b',
        ...VIEWPORT_PRESETS.mobile,
    },
];
const createViewportElement = (preset) => ({
    id: generatePrefixedId('viewport'),
    type: 'viewport',
    viewportWidth: preset.width,
    viewportHeight: preset.height,
    deviceName: preset.name,
    styles: {},
    children: [],
    canvasPosition: { x: 100, y: 100 },
});
export const InsertPanel = ({ onAddElement, readOnly = false }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const createTextNode = () => ({
        id: generatePrefixedId('text'),
        type: 'text',
        tag: 'span',
        text: 'Text',
        styles: {},
        canvasPosition: { x: 100, y: 100 }
    });
    const filteredTags = htmlTags.filter(tag => tag.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tag.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tag.description.toLowerCase().includes(searchQuery.toLowerCase()));
    // Filter viewport presets based on search
    const filteredViewports = viewportPresets.filter(preset => preset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        'viewport'.includes(searchQuery.toLowerCase()) ||
        'responsive'.includes(searchQuery.toLowerCase()));
    // Check if "text" matches the search query
    const showTextNode = searchQuery === '' ||
        'text'.includes(searchQuery.toLowerCase());
    return (_jsxs("div", { className: "w-full flex flex-col flex-1 overflow-hidden", children: [readOnly && (_jsx("div", { className: "px-4 py-2 bg-ed-muted/50 border-b border-ed-border", children: _jsx(Text, { size: "xs", variant: "secondary", children: "View only - cannot add elements" }) })), _jsx("div", { className: `px-4 py-3 border-b border-ed-border ${readOnly ? 'opacity-50 pointer-events-none' : ''}`, children: _jsxs("div", { className: "relative", children: [_jsx(MagnifyingGlassIcon, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-ed-muted-foreground", weight: "bold" }), _jsx("input", { type: "text", placeholder: "Search HTML elements...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-full pl-9 pr-3 py-2 text-sm bg-ed-background border border-ed-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ed-ring focus:ring-offset-2 text-ed-foreground placeholder:text-ed-muted-foreground" })] }) }), _jsx("div", { className: `flex-1 overflow-y-auto ${readOnly ? 'opacity-50 pointer-events-none' : ''}`, children: !showTextNode && filteredTags.length === 0 && filteredViewports.length === 0 ? (_jsx("div", { className: "px-4 py-8 text-center", children: _jsx(Text, { size: "sm", variant: "secondary", children: "No elements found" }) })) : (_jsxs(_Fragment, { children: [filteredViewports.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "px-4 py-2 bg-ed-muted/30 border-b border-ed-border", children: _jsx(Text, { size: "xs", weight: "medium", variant: "secondary", children: "Viewports" }) }), filteredViewports.map((preset) => {
                                    const IconComponent = preset.icon;
                                    return (_jsxs("div", { className: "py-3 px-4 hover:bg-ed-accent cursor-pointer transition-colors flex items-center gap-3 border-b border-ed-border", onClick: () => onAddElement(createViewportElement(preset)), children: [_jsx("div", { className: "w-10 h-10 rounded flex items-center justify-center shrink-0", style: { background: preset.color }, children: _jsx(IconComponent, { size: 20, weight: "bold", className: "text-white" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-sm font-medium text-ed-foreground", children: preset.title }), _jsx("div", { className: "text-xs text-ed-muted-foreground", children: preset.description })] })] }, preset.key));
                                })] })), (showTextNode || filteredTags.length > 0) && (_jsx("div", { className: "px-4 py-2 bg-ed-muted/30 border-b border-ed-border", children: _jsx(Text, { size: "xs", weight: "medium", variant: "secondary", children: "Elements" }) })), showTextNode && (_jsxs("div", { className: "py-3 px-4 hover:bg-ed-accent cursor-pointer transition-colors flex items-center gap-3 border-b border-ed-border", onClick: () => onAddElement(createTextNode()), children: [_jsx("div", { className: "w-10 h-10 rounded flex items-center justify-center shrink-0", style: { background: '#6b7280' }, children: _jsx(TextT, { size: 20, weight: "bold", className: "text-white" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-sm font-medium text-ed-foreground", children: "Text" }), _jsx("div", { className: "text-xs text-ed-muted-foreground", children: "Plain text node" })] })] })), filteredTags.map((tagData) => (_jsx(InsertItem, { tagData: tagData, onClick: () => onAddElement(createElementFromTag(tagData)) }, tagData.tag)))] })) })] }));
};
