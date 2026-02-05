import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createElementFromTag } from "./htmlTagsData";
import { Text } from "./ui/Text";
import { createElement } from "react";
const renderPreview = (tagData) => {
    // Create the element with text content
    const element = createElementFromTag(tagData);
    // Only handle HTML elements (not components)
    if (element.type !== 'html') {
        return _jsx("div", { children: "Component" });
    }
    // Override styles to fit in the preview box
    const previewStyles = {
        ...element.styles,
        width: 'auto',
        height: 'auto',
        maxWidth: '100%',
        maxHeight: '100%',
        position: 'static',
        margin: '0',
        fontSize: '6px',
        padding: '2px',
    };
    // Void elements that cannot have children
    const voidElements = ['input', 'img', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'];
    const isVoidElement = voidElements.includes(element.tag?.toLowerCase() || '');
    // Special elements that use value prop instead of children
    const valueElements = ['textarea', 'select'];
    const usesValueProp = valueElements.includes(element.tag?.toLowerCase() || '');
    // Get text content from children (TextLeafNode)
    const textChild = element.children?.find(child => child.type === 'text');
    const textContent = textChild?.type === 'text' ? textChild.text : undefined;
    // Build props for the element
    const elementProps = {
        style: previewStyles,
    };
    if (usesValueProp && textContent) {
        elementProps.defaultValue = textContent;
    }
    // Render the element using createElement
    return (_jsx("div", { className: "pointer-events-none text-[6px] leading-tight", children: createElement(element.tag ?? 'div', elementProps, isVoidElement || usesValueProp ? undefined : textContent) }));
};
export const InsertItem = ({ tagData, onClick }) => {
    return (_jsxs("div", { onClick: onClick, className: "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-ed-accent transition-colors border-b border-ed-border cursor-pointer", children: [_jsx("div", { className: "shrink-0 w-10 h-10 rounded border border-ed-border flex items-center justify-center bg-ed-secondary", children: renderPreview(tagData) }), _jsxs("div", { className: "flex-1 min-w-0 text-left", children: [_jsx(Text, { size: "sm", weight: "medium", variant: "primary", className: "mb-0.5 block", children: tagData.title }), _jsx(Text, { size: "xs", variant: "secondary", className: "truncate block", children: tagData.description })] }), _jsx("div", { className: "shrink-0", children: _jsxs(Text, { size: "2xs", variant: "tertiary", className: "font-mono", children: ["<", tagData.tag, ">"] }) })] }));
};
