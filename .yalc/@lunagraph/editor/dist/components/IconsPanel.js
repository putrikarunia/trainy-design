"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Text } from "./ui/Text";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "./ui/Select";
import { extractIconNames, searchIcons } from "./utils/iconUtils";
import { generatePrefixedId } from "./utils/idUtils";
const GRID_COLUMNS = 4;
const ICON_CELL_SIZE = 64; // px
export function IconsPanel({ iconLibraries, onAddElement, readOnly = false }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLibrary, setSelectedLibrary] = useState(Object.keys(iconLibraries)[0] || "");
    const parentRef = useRef(null);
    const libraryConfig = iconLibraries[selectedLibrary];
    // Extract and cache icon names
    const allIconNames = useMemo(() => {
        if (!libraryConfig)
            return [];
        return extractIconNames(libraryConfig.icons, libraryConfig.iconNames);
    }, [libraryConfig]);
    // Filter by search query
    const filteredIcons = useMemo(() => {
        return searchIcons(allIconNames, searchQuery);
    }, [allIconNames, searchQuery]);
    // Calculate rows for virtualization
    const rowCount = Math.ceil(filteredIcons.length / GRID_COLUMNS);
    const virtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ICON_CELL_SIZE,
        overscan: 5,
    });
    const createIconElement = (iconName) => ({
        id: generatePrefixedId('icon'),
        type: 'icon',
        library: selectedLibrary,
        iconName,
        props: { ...libraryConfig?.defaultProps },
        styles: {},
        canvasPosition: { x: 100, y: 100 }
    });
    const handleIconClick = (iconName) => {
        onAddElement(createIconElement(iconName));
    };
    if (Object.keys(iconLibraries).length === 0) {
        return (_jsx("div", { className: "p-4 text-center", children: _jsx(Text, { size: "sm", variant: "tertiary", children: "No icon libraries registered. Pass iconLibraries prop to LunagraphEditor." }) }));
    }
    return (_jsxs("div", { className: "w-full flex flex-col flex-1 overflow-hidden", children: [readOnly && (_jsx("div", { className: "px-4 py-2 bg-ed-muted/50 border-b border-ed-border", children: _jsx(Text, { size: "xs", variant: "tertiary", children: "View only - cannot add icons" }) })), _jsxs("div", { className: `px-4 py-3 border-b border-ed-border space-y-3 ${readOnly ? 'opacity-50 pointer-events-none' : ''}`, children: [Object.keys(iconLibraries).length > 1 && (_jsxs(Select, { value: selectedLibrary, onValueChange: setSelectedLibrary, children: [_jsx(SelectTrigger, { className: "w-full", children: _jsx(SelectValue, { placeholder: "Select library" }) }), _jsx(SelectContent, { children: Object.entries(iconLibraries).map(([key, config]) => (_jsx(SelectItem, { value: key, children: config.displayName || key }, key))) })] })), _jsxs("div", { className: "relative", children: [_jsx(MagnifyingGlass, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-ed-muted-foreground pointer-events-none", weight: "bold" }), _jsx(Input, { type: "text", placeholder: "Search icons...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-9" })] }), _jsxs(Text, { size: "xs", variant: "tertiary", children: [filteredIcons.length, " icons"] })] }), _jsx("div", { ref: parentRef, className: `flex-1 overflow-auto ${readOnly ? 'opacity-50 pointer-events-none' : ''}`, children: _jsx("div", { style: {
                        height: virtualizer.getTotalSize(),
                        width: '100%',
                        position: 'relative',
                    }, children: virtualizer.getVirtualItems().map((virtualRow) => {
                        const startIndex = virtualRow.index * GRID_COLUMNS;
                        const rowIcons = filteredIcons.slice(startIndex, startIndex + GRID_COLUMNS);
                        return (_jsx("div", { style: {
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: ICON_CELL_SIZE,
                                transform: `translateY(${virtualRow.start}px)`,
                                display: 'grid',
                                gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
                            }, children: rowIcons.map((iconName) => {
                                const IconComponent = libraryConfig?.icons?.[iconName];
                                // Skip rendering if icon component not found
                                if (!IconComponent)
                                    return null;
                                return (_jsxs(Button, { variant: "ghost", size: "text", onClick: () => handleIconClick(iconName), className: "flex flex-col items-center justify-center p-2 h-auto rounded hover:bg-ed-accent", title: iconName, isChildText: false, children: [_jsx(IconComponent, { size: 24, ...libraryConfig?.defaultProps }), _jsx(Text, { size: "3xs", variant: "tertiary", className: "mt-1 truncate max-w-full", children: iconName.length > 8 ? iconName.slice(0, 7) + '…' : iconName })] }, iconName));
                            }) }, virtualRow.key));
                    }) }) })] }));
}
