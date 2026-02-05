import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { MagnifyingGlassIcon, CaretRightIcon, FolderIcon, DiamondsFourIcon, AtomIcon, CubeIcon } from "@phosphor-icons/react";
import { Text } from "./ui/Text";
import { Badge } from "./ui/Badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/Tooltip";
import { generatePrefixedId } from "./utils/idUtils";
function buildFileTree(componentIndex) {
    const root = { name: 'components', type: 'folder', path: '', children: [] };
    Object.entries(componentIndex).forEach(([componentName, data]) => {
        const pathParts = data.path.split('/');
        let current = root;
        // Navigate/create folder structure
        for (let i = 0; i < pathParts.length - 1; i++) {
            const folderName = pathParts[i];
            let folder = current.children?.find(child => child.name === folderName && child.type === 'folder');
            if (!folder) {
                folder = { name: folderName, type: 'folder', path: pathParts.slice(0, i + 1).join('/'), children: [] };
                current.children = current.children || [];
                current.children.push(folder);
            }
            current = folder;
        }
        // Get the file name (e.g., "button.tsx")
        const fileName = pathParts[pathParts.length - 1];
        // Find or create file node
        let fileNode = current.children?.find(child => child.name === fileName && child.type === 'file');
        if (!fileNode) {
            fileNode = {
                name: fileName,
                type: 'file',
                path: data.path,
                children: []
            };
            current.children = current.children || [];
            current.children.push(fileNode);
        }
        // Add component as child of file node
        fileNode.children = fileNode.children || [];
        fileNode.children.push({
            name: componentName,
            type: 'component',
            path: data.path,
            componentName
        });
    });
    return root;
}
export const AssetsPanel = ({ onAddElement, onEditComponent, onEditInternalComponent, componentIndex = {}, readOnly = false, draftComponentNames = new Set(), internalComponents, activeFileName, activeFilePath, }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedPaths, setExpandedPaths] = useState({
        'components': true // Root expanded by default
    });
    const [internalExpanded, setInternalExpanded] = useState(true);
    const fileTree = buildFileTree(componentIndex);
    const componentCount = Object.keys(componentIndex).length;
    const togglePath = (path) => {
        setExpandedPaths(prev => ({ ...prev, [path]: !prev[path] }));
    };
    const createComponentElement = (componentName) => {
        const componentInfo = componentIndex[componentName];
        const defaultProps = {};
        let hasChildrenProp = false;
        if (componentInfo?.props) {
            Object.entries(componentInfo.props).forEach(([propName, propInfo]) => {
                if (propName === 'children') {
                    hasChildrenProp = true;
                    return;
                }
                const propType = propInfo?.type || propInfo;
                const isRequired = propInfo?.required || false;
                if (propType.includes('=>') ||
                    propType.includes('() =>') ||
                    propType.includes('ComponentType') ||
                    propType.includes('Element') ||
                    propType.includes('CSSProperties')) {
                    if (isRequired) {
                        defaultProps[propName] = undefined;
                    }
                    return;
                }
                if (propType.includes('|') && (propType.includes('"') || propType.includes("'"))) {
                    const options = propType.split('|').map((s) => s.trim().replace(/['"]/g, ''));
                    const firstValid = options.find((opt) => opt !== 'undefined' && opt !== 'null' && opt.length > 0);
                    if (firstValid && isRequired) {
                        defaultProps[propName] = firstValid;
                    }
                    return;
                }
                if (propType.includes('string')) {
                    if (isRequired)
                        defaultProps[propName] = propName;
                }
                else if (propType.includes('number')) {
                    if (isRequired)
                        defaultProps[propName] = 0;
                }
                else if (propType.includes('boolean')) {
                    if (isRequired)
                        defaultProps[propName] = false;
                }
            });
        }
        const defaultChildren = hasChildrenProp ? [] : undefined;
        return {
            id: generatePrefixedId('component'),
            type: 'component',
            componentName,
            props: defaultProps,
            styles: { width: 'fit-content', height: 'fit-content' },
            children: defaultChildren,
            canvasPosition: { x: 100, y: 100 }
        };
    };
    // Recursive tree renderer
    const renderTree = (node, depth = 0) => {
        if (node.type === 'folder' && !node.children?.length)
            return null;
        if (node.type === 'file' && !node.children?.length)
            return null;
        if (!!searchQuery &&
            node.type === 'file' &&
            !node.componentName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !node.name?.toLowerCase().includes(searchQuery.toLowerCase()))
            return null;
        const isExpanded = expandedPaths[node.path] ?? true;
        const paddingLeft = depth * 12 + 16; // 12px per level + 16px base
        if (node.type === 'folder') {
            return (_jsxs("div", { children: [_jsxs("div", { onClick: () => togglePath(node.path), className: "py-1.5 hover:bg-ed-accent cursor-pointer transition-colors flex items-center gap-1.5", style: { paddingLeft }, children: [_jsx(CaretRightIcon, { size: 14, weight: "bold", className: `text-ed-muted-foreground transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}` }), _jsx(FolderIcon, { size: 14, weight: "bold", className: "text-ed-muted-foreground shrink-0" }), _jsx(Text, { size: "xs", weight: "medium", variant: "secondary", children: node.name })] }), isExpanded && node.children?.map(child => renderTree(child, depth + 1))] }, node.path));
        }
        // File node
        if (node.type === 'file') {
            return (_jsxs("div", { children: [_jsxs("div", { onClick: () => togglePath(node.path), className: "py-1.5 hover:bg-ed-accent cursor-pointer transition-colors flex items-center gap-1.5", style: { paddingLeft }, children: [_jsx(CaretRightIcon, { size: 14, weight: "bold", className: `text-ed-muted-foreground transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}` }), _jsx(AtomIcon, { size: 14, weight: "bold", className: "text-ed-muted-foreground shrink-0" }), _jsx(Text, { size: "xs", weight: "medium", children: node.name })] }), isExpanded && node.children?.map(child => renderTree(child, depth + 1))] }, node.path));
        }
        // Component node
        let clickTimer = null;
        const hasDraft = draftComponentNames.has(node.componentName);
        const handleClick = (e) => {
            // Clear any pending single-click action
            if (clickTimer) {
                clearTimeout(clickTimer);
                clickTimer = null;
            }
            if (e.detail === 1) {
                // Single click - wait to see if it becomes a double-click
                // Skip in read-only mode (only double-click to open is allowed)
                if (readOnly)
                    return;
                clickTimer = setTimeout(() => {
                    onAddElement(createComponentElement(node.componentName));
                }, 250);
            }
            else if (e.detail === 2) {
                // Double click - edit component (allowed in both modes)
                onEditComponent?.(node.componentName, node.path);
            }
        };
        const componentRow = (_jsxs("div", { onClick: handleClick, className: "py-1.5 hover:bg-ed-accent cursor-pointer transition-colors flex items-center gap-1.5", style: { paddingLeft }, children: [_jsx("div", { className: "w-3.5 shrink-0" }), " ", _jsx(DiamondsFourIcon, { size: 14, weight: "fill", className: "text-purple-500 shrink-0" }), _jsx(Text, { size: "xs", weight: "medium", children: node.name }), hasDraft && (_jsx(Badge, { variant: "warning", className: "text-[10px] ml-auto mr-2", children: "Draft" }))] }, node.componentName));
        // In read-only mode, wrap with tooltip to indicate double-click behavior
        if (readOnly) {
            return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: componentRow }), _jsx(TooltipContent, { side: "right", children: "Double-click to open component" })] }, node.componentName));
        }
        return componentRow;
    };
    return (_jsxs("div", { className: "w-full flex flex-col flex-1 overflow-hidden", children: [readOnly && (_jsx("div", { className: "px-4 py-2 bg-ed-muted/50 border-b border-ed-border", children: _jsx(Text, { size: "xs", variant: "secondary", children: "View only \u2014 double-click to open component" }) })), _jsx("div", { className: "px-4 py-3 border-b border-ed-border", children: _jsxs("div", { className: "relative", children: [_jsx(MagnifyingGlassIcon, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-ed-muted-foreground", weight: "bold" }), _jsx("input", { type: "text", placeholder: "Search components...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-full pl-9 pr-3 py-2 text-sm bg-ed-background border border-ed-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ed-ring focus:ring-offset-2 text-ed-foreground placeholder:text-ed-muted-foreground" })] }) }), _jsxs("div", { className: "flex-1 overflow-y-auto", children: [internalComponents && internalComponents.length > 0 && (_jsxs("div", { className: "border-b border-ed-border", children: [_jsxs("div", { onClick: () => setInternalExpanded(!internalExpanded), className: "px-4 py-2 bg-ed-muted/30 hover:bg-ed-muted/50 cursor-pointer transition-colors flex items-center gap-2", children: [_jsx(CaretRightIcon, { size: 14, weight: "bold", className: `text-ed-muted-foreground transition-transform shrink-0 ${internalExpanded ? 'rotate-90' : ''}` }), _jsx(CubeIcon, { size: 14, weight: "bold", className: "text-amber-500 shrink-0" }), _jsx(Text, { size: "xs", weight: "medium", children: "Internal Components" }), _jsx(Badge, { variant: "secondary", className: "text-[10px] ml-auto", children: activeFileName })] }), internalExpanded && (_jsx("div", { className: "py-1", children: internalComponents.map((component) => {
                                    // Create click handler similar to regular components
                                    let clickTimer = null;
                                    const handleInternalClick = (e) => {
                                        if (clickTimer) {
                                            clearTimeout(clickTimer);
                                            clickTimer = null;
                                        }
                                        if (e.detail === 1) {
                                            // Single click - add to canvas (skip in read-only mode)
                                            if (readOnly)
                                                return;
                                            clickTimer = setTimeout(() => {
                                                // Create a component element for this internal component
                                                const internalElement = {
                                                    id: generatePrefixedId('component'),
                                                    type: 'component',
                                                    componentName: component.name,
                                                    props: {},
                                                    styles: { width: 'fit-content', height: 'fit-content' },
                                                    canvasPosition: { x: 100, y: 100 }
                                                };
                                                onAddElement(internalElement);
                                            }, 250);
                                        }
                                        else if (e.detail === 2) {
                                            // Double-click - open internal component for editing
                                            if (activeFilePath && onEditInternalComponent) {
                                                onEditInternalComponent(component.name, activeFilePath, component.startLine, component.endLine);
                                            }
                                        }
                                    };
                                    return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsxs("div", { className: "py-1.5 hover:bg-ed-accent cursor-pointer transition-colors flex items-center gap-1.5", style: { paddingLeft: 40 }, onClick: handleInternalClick, children: [_jsx(DiamondsFourIcon, { size: 14, weight: "fill", className: "text-amber-500 shrink-0" }), _jsx(Text, { size: "xs", weight: "medium", children: component.name })] }) }), _jsx(TooltipContent, { side: "right", children: readOnly ? 'Double-click to open' : `Lines ${component.startLine}-${component.endLine} • Double-click to edit` })] }, component.name));
                                }) }))] })), componentCount === 0 ? (_jsx("div", { className: "px-4 py-8 text-center", children: _jsx(Text, { size: "sm", variant: "secondary", children: "No components found. Run 'lunagraph scan' to index your components." }) })) : (_jsx("div", { className: "py-2", children: fileTree.children?.map(child => renderTree(child, 0)) }))] })] }));
};
