"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from "react";
import { findElement } from "./utils/treeUtils";
import { Button } from "./ui/Button";
import { DiamondsFourIcon, XIcon, PlusIcon, SquaresFourIcon, RowsIcon, ColumnsIcon, SquareIcon, CaretDownIcon, AlignTopSimpleIcon, AlignBottomSimpleIcon, AlignLeftSimpleIcon, AlignRightSimpleIcon, ArrowsVerticalIcon, ArrowsHorizontalIcon, SelectionIcon, CornersOutIcon, ProhibitIcon, TextAlignLeftIcon, TextAlignCenterIcon, TextAlignRightIcon, TextAlignJustifyIcon, ArrowsOutLineHorizontalIcon, ArrowsInLineHorizontalIcon, PauseIcon, } from "@phosphor-icons/react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/Tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/Tabs";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuSeparator } from "./ui/DropdownMenu";
import { cn } from "../lib/utils";
function getActualDomElement(elementId) {
    const elements = document.querySelectorAll(`[data-element-id="${elementId}"]`);
    if (elements.length === 0)
        return null;
    for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (el.getAttribute('role') !== 'button' && el.getAttribute('aria-roledescription') !== 'draggable') {
            return el;
        }
    }
    return elements[elements.length - 1];
}
// ============================================================================
// MULTI-SELECT HELPERS
// ============================================================================
const MIXED = Symbol('mixed');
/**
 * Get a merged value from multiple elements.
 * Returns the common value if all elements have the same value, or MIXED if values differ.
 */
function getMergedValue(elements, getter) {
    let value = undefined;
    let first = true;
    for (const el of elements) {
        const v = getter(el);
        if (first) {
            value = v;
            first = false;
        }
        else if (value !== v) {
            // Handle object comparison for style values
            if (typeof value === 'object' && typeof v === 'object') {
                if (JSON.stringify(value) !== JSON.stringify(v)) {
                    return MIXED;
                }
            }
            else {
                return MIXED;
            }
        }
    }
    return value;
}
/**
 * Check if a value is mixed
 */
function isMixed(value) {
    return value === MIXED;
}
/**
 * Get display string for a value that might be mixed
 */
function getMixedDisplay(value) {
    if (isMixed(value))
        return 'Mixed';
    if (value === undefined || value === null || value === '')
        return '';
    return String(value);
}
// ============================================================================
// UI COMPONENTS
// ============================================================================
// Inline input with label and unit
function InlineInput({ label, icon, value, onChange, onClear, isSet = false, unit = "px", showUnit = true, placeholder = "auto", className, isMixedValue = false, }) {
    const stripUnit = (val) => {
        if (val === undefined || val === null)
            return '';
        const str = String(val);
        if (!str || str === 'auto' || str === 'none' || str === 'normal')
            return str;
        const match = str.match(/^(-?[\d.]+)/);
        return match ? match[1] : str;
    };
    const [localValue, setLocalValue] = useState(isMixedValue ? '' : stripUnit(value));
    const [showMixed, setShowMixed] = useState(isMixedValue);
    useEffect(() => {
        if (isMixedValue) {
            setLocalValue('');
            setShowMixed(true);
        }
        else {
            setLocalValue(stripUnit(value));
            setShowMixed(false);
        }
    }, [value, isMixedValue]);
    const save = () => {
        if (localValue === '' && showMixed)
            return; // Don't save empty when showing mixed
        if (localValue === '' || localValue === 'auto') {
            onChange(localValue);
            return;
        }
        // Only append unit if showUnit is true AND value is a number
        if (/^-?[\d.]+$/.test(localValue)) {
            onChange(showUnit ? localValue + unit : localValue);
        }
        else {
            onChange(localValue);
        }
    };
    const handleChange = (e) => {
        setLocalValue(e.target.value);
        setShowMixed(false);
    };
    return (_jsxs("div", { className: cn("flex items-center gap-1.5 min-w-0", className), children: [label && _jsx("span", { className: "text-[11px] text-ed-muted-foreground shrink-0 flex items-center", children: label }), _jsxs("div", { className: "relative flex-1 min-w-0", children: [icon && (_jsx("span", { className: "absolute left-2 top-1/2 -translate-y-1/2 text-ed-muted-foreground/60 flex items-center justify-center pointer-events-none", children: icon })), _jsx("input", { type: "text", value: showMixed ? '' : localValue, onChange: handleChange, onBlur: save, onKeyDown: (e) => { if (e.key === 'Enter')
                            save(); }, placeholder: showMixed ? 'Mixed' : placeholder, className: cn("w-full h-7 text-[11px] font-mono bg-ed-muted/40 rounded text-left text-ed-foreground", "border border-transparent hover:border-ed-border focus:border-ed-ring focus:outline-none", icon ? "pl-7" : "pl-2", showUnit ? "pr-6" : "pr-2", isSet && "ring-1 ring-ed-foreground/20", showMixed && "placeholder:italic placeholder:text-ed-muted-foreground") }), showUnit && localValue && !showMixed && /^-?[\d.]+$/.test(localValue) && (_jsx("span", { className: "absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-ed-muted-foreground/40", children: unit }))] }), onClear && isSet && (_jsx("button", { onClick: onClear, className: "w-5 h-5 flex items-center justify-center text-ed-muted-foreground hover:text-ed-foreground hover:bg-ed-muted rounded shrink-0", title: "Clear", children: _jsx(XIcon, { size: 10 }) }))] }));
}
// Min/Max input - saves on blur, handles unit properly
function MinMaxInput({ label, value, onChange, onClear, placeholder = "0", }) {
    const stripUnit = (val) => {
        if (val === undefined || val === null)
            return '';
        const str = String(val);
        if (!str || str === 'none' || str === 'auto')
            return str;
        const match = str.match(/^(-?[\d.]+)/);
        return match ? match[1] : str;
    };
    const [localValue, setLocalValue] = useState(stripUnit(value));
    useEffect(() => {
        setLocalValue(stripUnit(value));
    }, [value]);
    const save = () => {
        const trimmed = localValue.trim();
        if (trimmed === '' || trimmed === 'none') {
            onChange('');
        }
        else if (/^-?[\d.]+$/.test(trimmed)) {
            onChange(trimmed + 'px');
        }
        else {
            onChange(trimmed);
        }
    };
    return (_jsxs("div", { className: "flex items-center gap-1 ml-4", children: [_jsx("span", { className: "text-[10px] text-ed-muted-foreground w-6 shrink-0", children: label }), _jsx("input", { type: "text", value: localValue, onChange: (e) => setLocalValue(e.target.value), onBlur: save, onKeyDown: (e) => { if (e.key === 'Enter')
                    save(); }, placeholder: placeholder, className: "flex-1 h-6 px-2 text-[10px] font-mono bg-ed-muted/40 rounded border border-transparent hover:border-ed-border focus:border-ed-ring focus:outline-none text-ed-foreground" }), onClear && (_jsx("button", { type: "button", onClick: (e) => { e.preventDefault(); e.stopPropagation(); onClear(); }, className: "w-5 h-5 flex items-center justify-center text-ed-muted-foreground hover:text-ed-foreground hover:bg-ed-muted rounded", children: _jsx(XIcon, { size: 10 }) }))] }));
}
// Dimension input - click to edit, shows hug/fill/fixed value
function DimensionInput({ label, value, onChange, minValue, maxValue, onMinChange, onMaxChange, onClearMin, onClearMax, hasMin, hasMax, onAddMin, onAddMax, computedValue, isMixedValue = false, }) {
    const [editing, setEditing] = useState(false);
    const inputRef = useRef(null);
    const stripUnit = (val) => {
        if (val === undefined || val === null)
            return '';
        const str = String(val);
        if (!str || str === 'auto' || str === 'fit-content' || str === '100%')
            return str;
        const match = str.match(/^(-?[\d.]+)/);
        return match ? match[1] : str;
    };
    const [localValue, setLocalValue] = useState(stripUnit(value));
    useEffect(() => setLocalValue(stripUnit(value)), [value]);
    // Determine current mode
    const getMode = () => {
        if (isMixedValue)
            return 'mixed';
        if (value === 'auto' || value === 'fit-content' || value === '')
            return 'hug';
        if (value === '100%')
            return 'fill';
        return 'fixed';
    };
    const mode = getMode();
    // Get display text - always round to integers
    const getDisplayText = () => {
        if (isMixedValue)
            return 'Mixed';
        const computedNum = computedValue ? Math.round(parseFloat(stripUnit(computedValue))) : '';
        switch (mode) {
            case 'hug': return computedNum ? `hug (${computedNum})` : 'hug';
            case 'fill': return 'fill';
            default: {
                const num = parseFloat(stripUnit(value));
                return isNaN(num) ? stripUnit(value) : Math.round(num).toString();
            }
        }
    };
    const save = () => {
        setEditing(false);
        const trimmed = localValue.trim();
        if (trimmed === '' && isMixedValue)
            return; // Don't save empty when mixed
        if (trimmed === '' || trimmed === 'auto' || trimmed === 'hug') {
            onChange('auto');
        }
        else if (trimmed === 'fill' || trimmed === '100%') {
            onChange('100%');
        }
        else if (/^-?[\d.]+$/.test(trimmed)) {
            onChange(trimmed + 'px');
        }
        else {
            onChange(trimmed);
        }
    };
    const startEditing = () => {
        setEditing(true);
        setLocalValue(mode === 'fixed' ? stripUnit(value) : '');
        setTimeout(() => inputRef.current?.select(), 0);
    };
    const setFixed = () => onChange(localValue ? localValue + 'px' : '100px');
    const setHug = () => onChange('auto');
    const setFill = () => onChange('100%');
    return (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "text-[11px] text-ed-muted-foreground w-4 shrink-0", children: label }), _jsx("div", { className: "relative flex-1", children: editing ? (_jsx("input", { ref: inputRef, type: "text", value: localValue, onChange: (e) => setLocalValue(e.target.value), onBlur: save, onKeyDown: (e) => {
                                if (e.key === 'Enter')
                                    save();
                                if (e.key === 'Escape') {
                                    setEditing(false);
                                    setLocalValue(stripUnit(value));
                                }
                            }, placeholder: isMixedValue ? "Mixed" : "auto", autoFocus: true, className: cn("w-full h-7 px-2 text-[11px] font-mono bg-ed-muted/40 rounded text-left text-ed-foreground", "border border-ed-ring outline-none") })) : (_jsxs("div", { className: "flex items-center w-full", children: [_jsx("button", { type: "button", onClick: startEditing, className: cn("flex-1 min-w-0 h-7 px-2 text-[11px] font-mono bg-ed-muted/40 rounded-l text-left hover:bg-ed-muted overflow-hidden text-ellipsis whitespace-nowrap text-ed-foreground", isMixedValue && "italic text-ed-muted-foreground"), children: getDisplayText() }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { className: "h-7 w-7 px-0 bg-ed-muted/40 rounded-l-none rounded-r border-l border-ed-border/30 flex items-center justify-center hover:bg-ed-muted focus:outline-none", children: _jsx(CaretDownIcon, { size: 10, className: "text-ed-muted-foreground" }) }), _jsxs(DropdownMenuContent, { align: "end", className: "w-40", children: [_jsx(DropdownMenuCheckboxItem, { checked: mode === 'fixed', onCheckedChange: setFixed, children: "Fixed" }), _jsx(DropdownMenuCheckboxItem, { checked: mode === 'hug', onCheckedChange: setHug, children: "Hug contents" }), _jsx(DropdownMenuCheckboxItem, { checked: mode === 'fill', onCheckedChange: setFill, children: "Fill container" }), (!hasMin || !hasMax) && _jsx(DropdownMenuSeparator, {}), !hasMin && onAddMin && (_jsxs(DropdownMenuItem, { onClick: onAddMin, className: "text-ed-muted-foreground", children: ["Add Min ", label === 'W' ? 'Width' : 'Height'] })), !hasMax && onAddMax && (_jsxs(DropdownMenuItem, { onClick: onAddMax, className: "text-ed-muted-foreground", children: ["Add Max ", label === 'W' ? 'Width' : 'Height'] }))] })] })] })) })] }), hasMin && onMinChange && (_jsx(MinMaxInput, { label: "min", value: minValue, onChange: onMinChange, onClear: onClearMin, placeholder: "0" })), hasMax && onMaxChange && (_jsx(MinMaxInput, { label: "max", value: maxValue, onChange: onMaxChange, onClear: onClearMax, placeholder: "none" }))] }));
}
// Toggle button for style options - uses Button component
function IconBtn({ active, onClick, children, title, className, }) {
    return (_jsx(Button, { variant: "ghost", size: "icon-sm", onClick: onClick, title: title, isChildText: false, className: cn(active
            ? "bg-ed-foreground text-ed-background hover:bg-ed-foreground hover:text-ed-background"
            : "bg-ed-muted/40 text-ed-muted-foreground hover:bg-ed-muted hover:text-ed-foreground", className), children: children }));
}
// Wrapper for tooltip - avoids button-in-button issue
const TooltipBtn = React.forwardRef(({ active, onClick, children, className, ...props }, ref) => {
    return (_jsx("span", { ref: ref, className: cn("inline-flex", className), ...props, children: _jsx(Button, { variant: active ? "default" : "secondary", size: "icon-sm", onClick: onClick, isChildText: false, className: className, children: children }) }));
});
TooltipBtn.displayName = 'TooltipBtn';
// Section with title (always expanded)
function Section({ title, children, action }) {
    return (_jsxs("div", { className: "border-b border-ed-border/50", children: [_jsxs("div", { className: "flex items-center justify-between px-3 py-2", children: [_jsx("span", { className: "text-[11px] font-medium text-ed-foreground", children: title }), action] }), _jsx("div", { className: "px-3 pb-3 space-y-3", children: children })] }));
}
// Addable section - shows + when not set, shows content + X when set
function AddableSection({ title, isSet, onAdd, onRemove, children }) {
    return (_jsxs("div", { className: "border-b border-ed-border/50", children: [_jsxs("div", { className: "flex items-center justify-between px-3 py-2", children: [_jsx("span", { className: "text-[11px] font-medium text-ed-foreground", children: title }), _jsx("div", { className: "flex items-center gap-1", children: isSet ? (_jsx("button", { onClick: onRemove, className: "w-6 h-6 flex items-center justify-center text-ed-muted-foreground hover:text-ed-foreground hover:bg-ed-muted rounded", title: "Remove", children: _jsx(XIcon, { size: 14 }) })) : (_jsx("button", { onClick: onAdd, className: "w-6 h-6 flex items-center justify-center text-ed-muted-foreground hover:text-ed-foreground hover:bg-ed-muted rounded", title: "Add", children: _jsx(PlusIcon, { size: 14 }) })) })] }), isSet && (_jsx("div", { className: "px-3 pb-3 space-y-3", children: children }))] }));
}
// Subsection label
function Label({ children }) {
    return _jsx("span", { className: "text-[10px] text-ed-muted-foreground uppercase tracking-wider", children: children });
}
// Corner icon component - shows a single corner bracket
function CornerIcon({ corner, size = 12, className }) {
    // Unicode corner brackets: ⌜ ⌝ ⌞ ⌟
    const corners = { tl: '⌜', tr: '⌝', bl: '⌞', br: '⌟' };
    return (_jsx("span", { className: cn("font-mono leading-none", className), style: { fontSize: size }, children: corners[corner] }));
}
// Color picker row
function ColorRow({ label, value, onChange, isMixedValue = false, }) {
    const [localValue, setLocalValue] = useState(isMixedValue ? '' : value);
    const [showMixed, setShowMixed] = useState(isMixedValue);
    useEffect(() => {
        if (isMixedValue) {
            setLocalValue('');
            setShowMixed(true);
        }
        else {
            setLocalValue(value);
            setShowMixed(false);
        }
    }, [value, isMixedValue]);
    const toHex = (c) => {
        if (!c)
            return '#000000';
        if (c.startsWith('#'))
            return c.slice(0, 7);
        const m = c.match(/\d+/g);
        if (m && m.length >= 3) {
            const [r, g, b] = m.map(Number);
            return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        }
        return '#000000';
    };
    const handleColorChange = (e) => {
        setLocalValue(e.target.value);
        setShowMixed(false);
        onChange(e.target.value);
    };
    const handleTextChange = (e) => {
        setLocalValue(e.target.value);
        setShowMixed(false);
    };
    return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Label, { children: label }), _jsx("input", { type: "color", value: toHex(localValue), onChange: handleColorChange, className: "w-6 h-6 rounded cursor-pointer border border-ed-border/50 shrink-0" }), _jsx("input", { type: "text", value: showMixed ? '' : localValue, onChange: handleTextChange, onBlur: () => { if (!showMixed || localValue)
                    onChange(localValue); }, onKeyDown: (e) => e.key === 'Enter' && onChange(localValue), placeholder: showMixed ? 'Mixed' : '', className: cn("flex-1 h-7 px-2 text-[11px] font-mono bg-ed-muted/40 rounded border border-transparent hover:border-ed-border focus:border-ed-ring focus:outline-none text-ed-foreground", showMixed && "placeholder:italic placeholder:text-ed-muted-foreground") })] }));
}
// ============================================================================
// DESIGN TAB
// ============================================================================
function DesignTab({ element, selectedElementId, selectedElements, onUpdateElementStyles, onUpdateMultipleElementsStyles, readOnly, }) {
    const isMultiSelect = selectedElements && selectedElements.length > 1;
    const [computed, setComputed] = useState({});
    const [paddingLinked, setPaddingLinked] = useState(true);
    const [marginLinked, setMarginLinked] = useState(true);
    const [radiusLinked, setRadiusLinked] = useState(true);
    const [overflowLinked, setOverflowLinked] = useState(true);
    // Stringify element styles for dependency comparison
    const elementStylesJson = JSON.stringify(element?.styles || {});
    useEffect(() => {
        if (!selectedElementId || isMultiSelect) {
            setComputed({});
            return;
        }
        // Use requestAnimationFrame to ensure DOM is updated before reading computed styles
        const rafId = requestAnimationFrame(() => {
            const el = getActualDomElement(selectedElementId);
            if (!el)
                return;
            const cs = window.getComputedStyle(el);
            setComputed({
                position: cs.position, top: cs.top, right: cs.right, bottom: cs.bottom, left: cs.left, zIndex: cs.zIndex,
                display: cs.display, flexDirection: cs.flexDirection, flexWrap: cs.flexWrap,
                alignItems: cs.alignItems, justifyContent: cs.justifyContent, gap: cs.gap,
                width: cs.width, height: cs.height, minWidth: cs.minWidth, maxWidth: cs.maxWidth,
                paddingTop: cs.paddingTop, paddingRight: cs.paddingRight, paddingBottom: cs.paddingBottom, paddingLeft: cs.paddingLeft,
                marginTop: cs.marginTop, marginRight: cs.marginRight, marginBottom: cs.marginBottom, marginLeft: cs.marginLeft,
                backgroundColor: cs.backgroundColor, borderWidth: cs.borderWidth, borderColor: cs.borderColor,
                borderRadius: cs.borderRadius, borderStyle: cs.borderStyle,
                color: cs.color, fontSize: cs.fontSize, fontWeight: cs.fontWeight, lineHeight: cs.lineHeight, textAlign: cs.textAlign,
                opacity: cs.opacity, overflow: cs.overflow, overflowX: cs.overflowX, overflowY: cs.overflowY, visibility: cs.visibility,
                borderTopLeftRadius: cs.borderTopLeftRadius, borderTopRightRadius: cs.borderTopRightRadius,
                borderBottomRightRadius: cs.borderBottomRightRadius, borderBottomLeftRadius: cs.borderBottomLeftRadius,
            });
        });
        return () => cancelAnimationFrame(rafId);
        // Note: Removed 500ms polling interval - computed styles now update when:
        // 1. Selected element changes
        // 2. Element's inline styles change (via elementStylesJson dependency)
        // This is much more efficient than constant polling.
    }, [selectedElementId, elementStylesJson, isMultiSelect]);
    // For multi-select, compute merged values
    const getMergedStyle = (prop) => {
        if (!isMultiSelect || !selectedElements) {
            return element?.styles?.[prop] ?? computed[prop] ?? '';
        }
        const result = getMergedValue(selectedElements, (el) => el.styles?.[prop]);
        return result === undefined ? '' : result;
    };
    const styles = (element?.styles || {});
    // get returns either the value or 'Mixed' string for display
    const get = (p) => {
        if (isMultiSelect) {
            const merged = getMergedStyle(p);
            if (isMixed(merged))
                return 'Mixed';
            return merged === undefined ? '' : String(merged);
        }
        return styles[p] ?? computed[p] ?? '';
    };
    // Check if a property value is mixed
    const getIsMixed = (p) => {
        if (!isMultiSelect)
            return false;
        return isMixed(getMergedStyle(p));
    };
    const has = (p) => {
        if (isMultiSelect && selectedElements) {
            // Check if any element has this property set
            return selectedElements.some(el => {
                const s = el.styles;
                return s && p in s && s[p] !== undefined && s[p] !== '';
            });
        }
        return styles && p in styles && styles[p] !== undefined && styles[p] !== '';
    };
    const hasAny = (...props) => props.some(p => has(p));
    const set = (p, v) => {
        if (readOnly)
            return;
        if (isMultiSelect && onUpdateMultipleElementsStyles && selectedElements) {
            const ids = new Set(selectedElements.map(el => el.id));
            onUpdateMultipleElementsStyles(ids, (currentStyles) => ({ ...currentStyles, [p]: v }));
        }
        else {
            onUpdateElementStyles(selectedElementId, { ...styles, [p]: v });
        }
    };
    const setMultiple = (updates) => {
        if (readOnly)
            return;
        if (isMultiSelect && onUpdateMultipleElementsStyles && selectedElements) {
            const ids = new Set(selectedElements.map(el => el.id));
            onUpdateMultipleElementsStyles(ids, (currentStyles) => ({ ...currentStyles, ...updates }));
        }
        else {
            onUpdateElementStyles(selectedElementId, { ...styles, ...updates });
        }
    };
    const clear = (...props) => {
        if (readOnly)
            return;
        if (isMultiSelect && onUpdateMultipleElementsStyles && selectedElements) {
            const ids = new Set(selectedElements.map(el => el.id));
            onUpdateMultipleElementsStyles(ids, (currentStyles) => {
                const newStyles = { ...currentStyles };
                props.forEach(p => delete newStyles[p]);
                return newStyles;
            });
        }
        else {
            const newStyles = { ...styles };
            props.forEach(p => delete newStyles[p]);
            onUpdateElementStyles(selectedElementId, newStyles);
        }
    };
    const isFlex = get('display') === 'flex' || get('display') === 'inline-flex';
    const isPositioned = ['relative', 'absolute', 'fixed', 'sticky'].includes(get('position'));
    const flexDir = get('flexDirection');
    const alignItems = get('alignItems');
    const justifyContent = get('justifyContent');
    // Alignment grid helper - maps CSS values to grid position
    // The grid is visual: rows = vertical (top/center/bottom), cols = horizontal (left/center/right)
    // For row direction: justify-content = horizontal, align-items = vertical
    // For column direction: justify-content = vertical, align-items = horizontal
    const isColumnDirection = flexDir === 'column' || flexDir === 'column-reverse';
    const getAlignment = () => {
        const valToPos = {
            'flex-start': 0, 'start': 0, 'normal': 0, 'stretch': 0,
            'center': 1,
            'flex-end': 2, 'end': 2
        };
        const distributeValues = ['space-between', 'space-around', 'space-evenly'];
        if (isColumnDirection) {
            // Column: justify = vertical (row), align = horizontal (col)
            const row = distributeValues.includes(justifyContent) ? -1 : (valToPos[justifyContent] ?? 0);
            const col = valToPos[alignItems] ?? 0;
            return [row, col];
        }
        else {
            // Row: justify = horizontal (col), align = vertical (row)
            const row = valToPos[alignItems] ?? 0;
            const col = distributeValues.includes(justifyContent) ? -1 : (valToPos[justifyContent] ?? 0);
            return [row, col];
        }
    };
    const setAlignment = (row, col) => {
        const vals = ['flex-start', 'center', 'flex-end'];
        if (isColumnDirection) {
            // Column: row controls justify-content (vertical), col controls align-items (horizontal)
            setMultiple({
                justifyContent: vals[row],
                alignItems: vals[col]
            });
        }
        else {
            // Row: row controls align-items (vertical), col controls justify-content (horizontal)
            setMultiple({
                alignItems: vals[row],
                justifyContent: vals[col]
            });
        }
    };
    const [alignRow, alignCol] = getAlignment();
    if (!element && !isMultiSelect)
        return _jsx("p", { className: "p-3 text-[11px] text-ed-muted-foreground", children: "No element selected" });
    return (_jsxs("div", { className: "overflow-auto h-full", children: [_jsxs(Section, { title: "Layout", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Flow" }), _jsxs("div", { className: "flex gap-1", children: [_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(TooltipBtn, { active: !getIsMixed('display') && get('display') === 'block', onClick: () => set('display', 'block'), children: _jsx(SquareIcon, { size: 16 }) }) }), _jsx(TooltipContent, { children: "Block" })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(TooltipBtn, { active: !getIsMixed('display') && !getIsMixed('flexDirection') && isFlex && (flexDir === 'column' || flexDir === 'column-reverse'), onClick: () => setMultiple({ display: 'flex', flexDirection: 'column' }), children: _jsx(RowsIcon, { size: 16 }) }) }), _jsx(TooltipContent, { children: "Flex Column" })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(TooltipBtn, { active: !getIsMixed('display') && !getIsMixed('flexDirection') && isFlex && (flexDir === 'row' || flexDir === 'row-reverse'), onClick: () => setMultiple({ display: 'flex', flexDirection: 'row' }), children: _jsx(ColumnsIcon, { size: 16 }) }) }), _jsx(TooltipContent, { children: "Flex Row" })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(TooltipBtn, { active: !getIsMixed('display') && get('display') === 'grid', onClick: () => set('display', 'grid'), children: _jsx(SquaresFourIcon, { size: 16 }) }) }), _jsx(TooltipContent, { children: "Grid" })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(TooltipBtn, { active: !getIsMixed('display') && get('display') === 'none', onClick: () => set('display', 'none'), children: _jsx(ProhibitIcon, { size: 16 }) }) }), _jsx(TooltipContent, { children: "Hidden (display: none)" })] })] }), isFlex && (_jsxs("div", { className: "flex gap-1", children: [_jsx(IconBtn, { active: !getIsMixed('flexDirection') && (flexDir === 'row-reverse' || flexDir === 'column-reverse'), onClick: () => {
                                            const isReverse = flexDir?.includes('reverse');
                                            const base = flexDir?.includes('column') ? 'column' : 'row';
                                            set('flexDirection', isReverse ? base : `${base}-reverse`);
                                        }, title: "Reverse", className: "flex-1", children: _jsx("span", { className: "text-[9px] font-medium", children: "Reverse" }) }), _jsx(IconBtn, { active: !getIsMixed('flexWrap') && get('flexWrap') === 'wrap', onClick: () => set('flexWrap', get('flexWrap') === 'wrap' ? 'nowrap' : 'wrap'), title: "Wrap", className: "flex-1", children: _jsx("span", { className: "text-[9px] font-medium", children: "Wrap" }) })] }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Dimensions" }), _jsxs("div", { className: "space-y-2", children: [_jsx(DimensionInput, { label: "W", value: getIsMixed('width') ? '' : get('width'), onChange: (v) => set('width', v), minValue: get('minWidth'), maxValue: get('maxWidth'), hasMin: has('minWidth'), hasMax: has('maxWidth'), onMinChange: (v) => set('minWidth', v), onMaxChange: (v) => set('maxWidth', v), onAddMin: () => set('minWidth', '0px'), onAddMax: () => set('maxWidth', '100%'), onClearMin: () => clear('minWidth'), onClearMax: () => clear('maxWidth'), computedValue: computed.width, isMixedValue: getIsMixed('width') }), _jsx(DimensionInput, { label: "H", value: getIsMixed('height') ? '' : get('height'), onChange: (v) => set('height', v), minValue: get('minHeight'), maxValue: get('maxHeight'), hasMin: has('minHeight'), hasMax: has('maxHeight'), onMinChange: (v) => set('minHeight', v), onMaxChange: (v) => set('maxHeight', v), onAddMin: () => set('minHeight', '0px'), onAddMax: () => set('maxHeight', '100%'), onClearMin: () => clear('minHeight'), onClearMax: () => clear('maxHeight'), computedValue: computed.height, isMixedValue: getIsMixed('height') })] })] }), isFlex && (_jsxs("div", { className: "flex gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Align" }), _jsx("div", { className: "grid grid-cols-3 gap-0.5 p-1 bg-ed-muted/30 rounded w-fit", children: [0, 1, 2].map((row) => (_jsx(React.Fragment, { children: [0, 1, 2].map((col) => {
                                                const isActive = alignRow === row && alignCol === col;
                                                return (_jsx("button", { onClick: () => setAlignment(row, col), className: cn("w-7 h-7 rounded-sm flex items-center justify-center transition-colors", isActive ? "bg-ed-foreground" : "hover:bg-ed-muted"), title: `Align: ${['start', 'center', 'end'][row]} / Justify: ${['start', 'center', 'end'][col]}`, children: _jsx("div", { className: cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-ed-background" : "bg-ed-muted-foreground/40") }) }, `${row}-${col}`));
                                            }) }, row))) })] }), _jsxs("div", { className: "space-y-2 flex-1", children: [_jsx(Label, { children: "Gap" }), _jsx(InlineInput, { value: getIsMixed('gap') ? '' : get('gap'), onChange: (v) => set('gap', v), placeholder: "0", isMixedValue: getIsMixed('gap') }), _jsx(Label, { children: "Distribute" }), _jsxs("div", { className: "flex gap-1", children: [_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(TooltipBtn, { active: !getIsMixed('justifyContent') && justifyContent === 'space-between', onClick: () => set('justifyContent', justifyContent === 'space-between' ? 'flex-start' : 'space-between'), className: "flex-1", children: _jsx(ArrowsOutLineHorizontalIcon, { size: 16 }) }) }), _jsx(TooltipContent, { children: "Space Between" })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(TooltipBtn, { active: !getIsMixed('justifyContent') && justifyContent === 'space-around', onClick: () => set('justifyContent', justifyContent === 'space-around' ? 'flex-start' : 'space-around'), className: "flex-1", children: _jsx(ArrowsInLineHorizontalIcon, { size: 16 }) }) }), _jsx(TooltipContent, { children: "Space Around" })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(TooltipBtn, { active: !getIsMixed('justifyContent') && justifyContent === 'space-evenly', onClick: () => set('justifyContent', justifyContent === 'space-evenly' ? 'flex-start' : 'space-evenly'), className: "flex-1", children: _jsx(PauseIcon, { size: 16 }) }) }), _jsx(TooltipContent, { children: "Space Evenly" })] })] })] })] }))] }), _jsxs(AddableSection, { title: "Position", isSet: hasAny('position', 'top', 'right', 'bottom', 'left', 'zIndex'), onAdd: () => set('position', 'relative'), onRemove: () => clear('position', 'top', 'right', 'bottom', 'left', 'zIndex'), children: [_jsxs("div", { className: "flex gap-1", children: [_jsx(IconBtn, { active: !getIsMixed('position') && get('position') === 'static', onClick: () => set('position', 'static'), title: "Static", className: "flex-1", children: _jsx("span", { className: "text-[9px] font-medium", children: "Static" }) }), _jsx(IconBtn, { active: !getIsMixed('position') && get('position') === 'relative', onClick: () => set('position', 'relative'), title: "Relative", className: "flex-1", children: _jsx("span", { className: "text-[9px] font-medium", children: "Rel" }) }), _jsx(IconBtn, { active: !getIsMixed('position') && get('position') === 'absolute', onClick: () => set('position', 'absolute'), title: "Absolute", className: "flex-1", children: _jsx("span", { className: "text-[9px] font-medium", children: "Abs" }) }), _jsx(IconBtn, { active: !getIsMixed('position') && get('position') === 'fixed', onClick: () => set('position', 'fixed'), title: "Fixed", className: "flex-1", children: _jsx("span", { className: "text-[9px] font-medium", children: "Fix" }) })] }), isPositioned && (_jsxs("div", { className: "grid grid-cols-2 gap-1 mt-2", children: [_jsx(InlineInput, { label: "T", value: getIsMixed('top') ? '' : get('top'), onChange: (v) => set('top', v), placeholder: "auto", isMixedValue: getIsMixed('top') }), _jsx(InlineInput, { label: "R", value: getIsMixed('right') ? '' : get('right'), onChange: (v) => set('right', v), placeholder: "auto", isMixedValue: getIsMixed('right') }), _jsx(InlineInput, { label: "B", value: getIsMixed('bottom') ? '' : get('bottom'), onChange: (v) => set('bottom', v), placeholder: "auto", isMixedValue: getIsMixed('bottom') }), _jsx(InlineInput, { label: "L", value: getIsMixed('left') ? '' : get('left'), onChange: (v) => set('left', v), placeholder: "auto", isMixedValue: getIsMixed('left') })] })), _jsx(InlineInput, { label: "Z", value: getIsMixed('zIndex') ? '' : get('zIndex'), onChange: (v) => set('zIndex', v), placeholder: "auto", showUnit: false, isMixedValue: getIsMixed('zIndex') })] }), _jsxs(Section, { title: "Appearance", children: [_jsx(InlineInput, { label: "Opacity", value: getIsMixed('opacity') ? '' : get('opacity'), onChange: (v) => set('opacity', v), onClear: () => clear('opacity'), isSet: has('opacity'), placeholder: "1", showUnit: false, isMixedValue: getIsMixed('opacity') }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Visibility" }), _jsxs("div", { className: "flex gap-1", children: [_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(TooltipBtn, { active: !getIsMixed('visibility') && (get('visibility') === 'visible' || !has('visibility')), onClick: () => clear('visibility'), className: "flex-1", children: _jsx("span", { className: "text-[9px] font-medium", children: "Visible" }) }) }), _jsx(TooltipContent, { children: "visibility: visible" })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(TooltipBtn, { active: !getIsMixed('visibility') && get('visibility') === 'hidden', onClick: () => set('visibility', 'hidden'), className: "flex-1", children: _jsx("span", { className: "text-[9px] font-medium", children: "Hidden" }) }) }), _jsx(TooltipContent, { children: "visibility: hidden (keeps layout space)" })] })] })] }), _jsx(InlineInput, { label: "Z-Index", value: getIsMixed('zIndex') ? '' : get('zIndex'), onChange: (v) => set('zIndex', v), onClear: () => clear('zIndex'), isSet: has('zIndex'), placeholder: "auto", showUnit: false, isMixedValue: getIsMixed('zIndex') }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Overflow" }), _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("div", { className: "flex-1 min-w-0", children: overflowLinked ? (_jsx("div", { className: "flex gap-1", children: ['visible', 'hidden', 'scroll', 'auto'].map((val) => (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(TooltipBtn, { active: !getIsMixed('overflow') && (get('overflow') === val || (!has('overflow') && val === 'visible')), onClick: () => {
                                                                if (val === 'visible' && !has('overflow') && !isMultiSelect)
                                                                    return;
                                                                // Set overflow and clear individual overflowX/Y
                                                                if (isMultiSelect && onUpdateMultipleElementsStyles && selectedElements) {
                                                                    const ids = new Set(selectedElements.map(el => el.id));
                                                                    onUpdateMultipleElementsStyles(ids, (currentStyles) => {
                                                                        const newStyles = { ...currentStyles, overflow: val };
                                                                        delete newStyles.overflowX;
                                                                        delete newStyles.overflowY;
                                                                        return newStyles;
                                                                    });
                                                                }
                                                                else {
                                                                    const newStyles = { ...styles, overflow: val };
                                                                    delete newStyles.overflowX;
                                                                    delete newStyles.overflowY;
                                                                    if (!readOnly)
                                                                        onUpdateElementStyles(selectedElementId, newStyles);
                                                                }
                                                            }, className: "flex-1", children: _jsx("span", { className: "text-[9px] font-medium capitalize", children: val === 'visible' ? 'Vis' : val === 'hidden' ? 'Hide' : val === 'scroll' ? 'Scroll' : 'Auto' }) }) }), _jsxs(TooltipContent, { children: ["overflow: ", val] })] }, val))) })) : (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-[10px] text-ed-muted-foreground w-4", children: "X" }), _jsx("div", { className: "flex gap-1 flex-1", children: ['visible', 'hidden', 'scroll', 'auto'].map((val) => (_jsx(IconBtn, { active: !getIsMixed('overflowX') && (get('overflowX') === val || (!has('overflowX') && val === 'visible')), onClick: () => set('overflowX', val), className: "flex-1", children: _jsx("span", { className: "text-[8px] font-medium capitalize", children: val === 'visible' ? 'Vis' : val === 'hidden' ? 'Hide' : val === 'scroll' ? 'Scr' : 'Auto' }) }, val))) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-[10px] text-ed-muted-foreground w-4", children: "Y" }), _jsx("div", { className: "flex gap-1 flex-1", children: ['visible', 'hidden', 'scroll', 'auto'].map((val) => (_jsx(IconBtn, { active: !getIsMixed('overflowY') && (get('overflowY') === val || (!has('overflowY') && val === 'visible')), onClick: () => set('overflowY', val), className: "flex-1", children: _jsx("span", { className: "text-[8px] font-medium capitalize", children: val === 'visible' ? 'Vis' : val === 'hidden' ? 'Hide' : val === 'scroll' ? 'Scr' : 'Auto' }) }, val))) })] })] })) }), _jsx("button", { onClick: () => setOverflowLinked(!overflowLinked), className: cn("w-7 h-7 flex items-center justify-center rounded border shrink-0", !overflowLinked
                                            ? "bg-ed-primary text-ed-primary-foreground border-ed-primary"
                                            : "text-ed-muted-foreground hover:text-ed-foreground hover:bg-ed-muted border-transparent hover:border-ed-border"), title: overflowLinked ? "Separate X/Y" : "Link X/Y", children: _jsx(SelectionIcon, { size: 16 }) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Corner Radius" }), _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("div", { className: "flex-1 min-w-0", children: radiusLinked ? (_jsx(InlineInput, { icon: _jsx(CornersOutIcon, { size: 12 }), value: getIsMixed('borderRadius') ? '' : get('borderRadius'), onChange: (v) => {
                                                // When linked, set borderRadius and clear individual corners
                                                if (isMultiSelect && onUpdateMultipleElementsStyles && selectedElements) {
                                                    const ids = new Set(selectedElements.map(el => el.id));
                                                    onUpdateMultipleElementsStyles(ids, (currentStyles) => {
                                                        const newStyles = { ...currentStyles, borderRadius: v };
                                                        delete newStyles.borderTopLeftRadius;
                                                        delete newStyles.borderTopRightRadius;
                                                        delete newStyles.borderBottomRightRadius;
                                                        delete newStyles.borderBottomLeftRadius;
                                                        return newStyles;
                                                    });
                                                }
                                                else {
                                                    const newStyles = { ...styles, borderRadius: v };
                                                    delete newStyles.borderTopLeftRadius;
                                                    delete newStyles.borderTopRightRadius;
                                                    delete newStyles.borderBottomRightRadius;
                                                    delete newStyles.borderBottomLeftRadius;
                                                    if (!readOnly)
                                                        onUpdateElementStyles(selectedElementId, newStyles);
                                                }
                                            }, onClear: () => clear('borderRadius'), isSet: has('borderRadius'), placeholder: "0", isMixedValue: getIsMixed('borderRadius') })) : (_jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx(InlineInput, { icon: _jsx(CornerIcon, { corner: "tl" }), value: getIsMixed('borderTopLeftRadius') ? '' : get('borderTopLeftRadius'), onChange: (v) => set('borderTopLeftRadius', v), placeholder: "0", isMixedValue: getIsMixed('borderTopLeftRadius') }), _jsx(InlineInput, { icon: _jsx(CornerIcon, { corner: "tr" }), value: getIsMixed('borderTopRightRadius') ? '' : get('borderTopRightRadius'), onChange: (v) => set('borderTopRightRadius', v), placeholder: "0", isMixedValue: getIsMixed('borderTopRightRadius') }), _jsx(InlineInput, { icon: _jsx(CornerIcon, { corner: "bl" }), value: getIsMixed('borderBottomLeftRadius') ? '' : get('borderBottomLeftRadius'), onChange: (v) => set('borderBottomLeftRadius', v), placeholder: "0", isMixedValue: getIsMixed('borderBottomLeftRadius') }), _jsx(InlineInput, { icon: _jsx(CornerIcon, { corner: "br" }), value: getIsMixed('borderBottomRightRadius') ? '' : get('borderBottomRightRadius'), onChange: (v) => set('borderBottomRightRadius', v), placeholder: "0", isMixedValue: getIsMixed('borderBottomRightRadius') })] })) }), _jsx("button", { onClick: () => setRadiusLinked(!radiusLinked), className: cn("w-7 h-7 flex items-center justify-center rounded border shrink-0", !radiusLinked
                                            ? "bg-ed-primary text-ed-primary-foreground border-ed-primary"
                                            : "text-ed-muted-foreground hover:text-ed-foreground hover:bg-ed-muted border-transparent hover:border-ed-border"), title: radiusLinked ? "Separate corners" : "Link corners", children: _jsx(SelectionIcon, { size: 16 }) })] })] })] }), _jsx(AddableSection, { title: "Padding", isSet: hasAny('paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'padding'), onAdd: () => setMultiple({ paddingTop: '16px', paddingRight: '16px', paddingBottom: '16px', paddingLeft: '16px' }), onRemove: () => clear('paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'padding'), children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("div", { className: "flex-1 grid grid-cols-2 gap-2", children: paddingLinked ? (_jsxs(_Fragment, { children: [_jsx(InlineInput, { icon: _jsx(ArrowsVerticalIcon, { size: 12 }), value: getIsMixed('paddingTop') ? '' : get('paddingTop'), onChange: (v) => setMultiple({ paddingTop: v, paddingBottom: v }), placeholder: "0", isMixedValue: getIsMixed('paddingTop') }), _jsx(InlineInput, { icon: _jsx(ArrowsHorizontalIcon, { size: 12 }), value: getIsMixed('paddingLeft') ? '' : get('paddingLeft'), onChange: (v) => setMultiple({ paddingLeft: v, paddingRight: v }), placeholder: "0", isMixedValue: getIsMixed('paddingLeft') })] })) : (_jsxs(_Fragment, { children: [_jsx(InlineInput, { icon: _jsx(AlignTopSimpleIcon, { size: 12 }), value: getIsMixed('paddingTop') ? '' : get('paddingTop'), onChange: (v) => set('paddingTop', v), placeholder: "0", isMixedValue: getIsMixed('paddingTop') }), _jsx(InlineInput, { icon: _jsx(AlignBottomSimpleIcon, { size: 12 }), value: getIsMixed('paddingBottom') ? '' : get('paddingBottom'), onChange: (v) => set('paddingBottom', v), placeholder: "0", isMixedValue: getIsMixed('paddingBottom') }), _jsx(InlineInput, { icon: _jsx(AlignLeftSimpleIcon, { size: 12 }), value: getIsMixed('paddingLeft') ? '' : get('paddingLeft'), onChange: (v) => set('paddingLeft', v), placeholder: "0", isMixedValue: getIsMixed('paddingLeft') }), _jsx(InlineInput, { icon: _jsx(AlignRightSimpleIcon, { size: 12 }), value: getIsMixed('paddingRight') ? '' : get('paddingRight'), onChange: (v) => set('paddingRight', v), placeholder: "0", isMixedValue: getIsMixed('paddingRight') })] })) }), _jsx("button", { onClick: () => setPaddingLinked(!paddingLinked), className: cn("w-7 h-7 flex items-center justify-center rounded border shrink-0", !paddingLinked
                                ? "bg-ed-primary text-ed-primary-foreground border-ed-primary"
                                : "text-ed-muted-foreground hover:text-ed-foreground hover:bg-ed-muted border-transparent hover:border-ed-border"), title: paddingLinked ? "Separate sides" : "Link sides", children: _jsx(SelectionIcon, { size: 16 }) })] }) }), _jsx(AddableSection, { title: "Margin", isSet: hasAny('marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'margin'), onAdd: () => setMultiple({ marginTop: '16px', marginRight: '16px', marginBottom: '16px', marginLeft: '16px' }), onRemove: () => clear('marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'margin'), children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("div", { className: "flex-1 grid grid-cols-2 gap-2", children: marginLinked ? (_jsxs(_Fragment, { children: [_jsx(InlineInput, { icon: _jsx(ArrowsVerticalIcon, { size: 12 }), value: getIsMixed('marginTop') ? '' : get('marginTop'), onChange: (v) => setMultiple({ marginTop: v, marginBottom: v }), placeholder: "0", isMixedValue: getIsMixed('marginTop') }), _jsx(InlineInput, { icon: _jsx(ArrowsHorizontalIcon, { size: 12 }), value: getIsMixed('marginLeft') ? '' : get('marginLeft'), onChange: (v) => setMultiple({ marginLeft: v, marginRight: v }), placeholder: "0", isMixedValue: getIsMixed('marginLeft') })] })) : (_jsxs(_Fragment, { children: [_jsx(InlineInput, { icon: _jsx(AlignBottomSimpleIcon, { size: 12 }), value: getIsMixed('marginTop') ? '' : get('marginTop'), onChange: (v) => set('marginTop', v), placeholder: "0", isMixedValue: getIsMixed('marginTop') }), _jsx(InlineInput, { icon: _jsx(AlignTopSimpleIcon, { size: 12 }), value: getIsMixed('marginBottom') ? '' : get('marginBottom'), onChange: (v) => set('marginBottom', v), placeholder: "0", isMixedValue: getIsMixed('marginBottom') }), _jsx(InlineInput, { icon: _jsx(AlignRightSimpleIcon, { size: 12 }), value: getIsMixed('marginLeft') ? '' : get('marginLeft'), onChange: (v) => set('marginLeft', v), placeholder: "0", isMixedValue: getIsMixed('marginLeft') }), _jsx(InlineInput, { icon: _jsx(AlignLeftSimpleIcon, { size: 12 }), value: getIsMixed('marginRight') ? '' : get('marginRight'), onChange: (v) => set('marginRight', v), placeholder: "0", isMixedValue: getIsMixed('marginRight') })] })) }), _jsx("button", { onClick: () => setMarginLinked(!marginLinked), className: cn("w-7 h-7 flex items-center justify-center rounded border shrink-0", !marginLinked
                                ? "bg-ed-primary text-ed-primary-foreground border-ed-primary"
                                : "text-ed-muted-foreground hover:text-ed-foreground hover:bg-ed-muted border-transparent hover:border-ed-border"), title: marginLinked ? "Separate sides" : "Link sides", children: _jsx(SelectionIcon, { size: 16 }) })] }) }), _jsx(AddableSection, { title: "Background", isSet: has('backgroundColor'), onAdd: () => set('backgroundColor', '#ffffff'), onRemove: () => clear('backgroundColor'), children: _jsx(ColorRow, { label: "Color", value: getIsMixed('backgroundColor') ? '' : get('backgroundColor'), onChange: (v) => set('backgroundColor', v), isMixedValue: getIsMixed('backgroundColor') }) }), _jsxs(AddableSection, { title: "Border", isSet: hasAny('borderWidth', 'borderColor', 'borderStyle'), onAdd: () => setMultiple({ borderWidth: '1px', borderStyle: 'solid', borderColor: '#000000' }), onRemove: () => clear('borderWidth', 'borderColor', 'borderStyle'), children: [_jsx(InlineInput, { label: "Width", value: getIsMixed('borderWidth') ? '' : get('borderWidth'), onChange: (v) => set('borderWidth', v), placeholder: "0", isMixedValue: getIsMixed('borderWidth') }), _jsx(ColorRow, { label: "Color", value: getIsMixed('borderColor') ? '' : get('borderColor'), onChange: (v) => set('borderColor', v), isMixedValue: getIsMixed('borderColor') }), _jsx("div", { className: "flex gap-1", children: ['none', 'solid', 'dashed', 'dotted'].map((style) => (_jsx(IconBtn, { active: !getIsMixed('borderStyle') && get('borderStyle') === style, onClick: () => set('borderStyle', style), className: "flex-1", children: _jsx("span", { className: "text-[9px] font-medium capitalize", children: style === 'none' ? '—' : style }) }, style))) })] }), _jsxs(AddableSection, { title: "Typography", isSet: hasAny('color', 'fontSize', 'fontWeight', 'textAlign'), onAdd: () => set('color', '#000000'), onRemove: () => clear('color', 'fontSize', 'fontWeight', 'textAlign'), children: [_jsx(ColorRow, { label: "Color", value: getIsMixed('color') ? '' : get('color'), onChange: (v) => set('color', v), isMixedValue: getIsMixed('color') }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx(InlineInput, { label: "Size", value: getIsMixed('fontSize') ? '' : get('fontSize'), onChange: (v) => set('fontSize', v), placeholder: "16", isMixedValue: getIsMixed('fontSize') }), _jsx(InlineInput, { label: "Wt", value: getIsMixed('fontWeight') ? '' : get('fontWeight'), onChange: (v) => set('fontWeight', v), placeholder: "400", showUnit: false, isMixedValue: getIsMixed('fontWeight') })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Align" }), _jsxs("div", { className: "flex gap-1", children: [_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(TooltipBtn, { active: !getIsMixed('textAlign') && get('textAlign') === 'left', onClick: () => set('textAlign', 'left'), className: "flex-1", children: _jsx(TextAlignLeftIcon, { size: 16 }) }) }), _jsx(TooltipContent, { children: "Left" })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(TooltipBtn, { active: !getIsMixed('textAlign') && get('textAlign') === 'center', onClick: () => set('textAlign', 'center'), className: "flex-1", children: _jsx(TextAlignCenterIcon, { size: 16 }) }) }), _jsx(TooltipContent, { children: "Center" })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(TooltipBtn, { active: !getIsMixed('textAlign') && get('textAlign') === 'right', onClick: () => set('textAlign', 'right'), className: "flex-1", children: _jsx(TextAlignRightIcon, { size: 16 }) }) }), _jsx(TooltipContent, { children: "Right" })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(TooltipBtn, { active: !getIsMixed('textAlign') && get('textAlign') === 'justify', onClick: () => set('textAlign', 'justify'), className: "flex-1", children: _jsx(TextAlignJustifyIcon, { size: 16 }) }) }), _jsx(TooltipContent, { children: "Justify" })] })] })] })] })] }));
}
// ============================================================================
// CLASSES TAB
// ============================================================================
function getTailwindCategory(className) {
    const patterns = [
        [/^w-/, 'width'], [/^min-w-/, 'min-width'], [/^max-w-/, 'max-width'],
        [/^h-/, 'height'], [/^min-h-/, 'min-height'], [/^max-h-/, 'max-height'],
        [/^p-/, 'padding'], [/^px-/, 'padding-x'], [/^py-/, 'padding-y'],
        [/^pt-/, 'padding-top'], [/^pr-/, 'padding-right'], [/^pb-/, 'padding-bottom'], [/^pl-/, 'padding-left'],
        [/^m-/, 'margin'], [/^mx-/, 'margin-x'], [/^my-/, 'margin-y'],
        [/^mt-/, 'margin-top'], [/^mr-/, 'margin-right'], [/^mb-/, 'margin-bottom'], [/^ml-/, 'margin-left'],
        [/^-m/, 'margin'], [/^bg-/, 'background'],
        [/^text-(black|white|transparent|current|inherit)$/, 'text-color'],
        [/^text-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-/, 'text-color'],
        [/^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/, 'text-size'],
        [/^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/, 'font-weight'],
        [/^(block|inline-block|inline|flex|inline-flex|grid|inline-grid|hidden)$/, 'display'],
        [/^flex-(row|col|row-reverse|col-reverse)$/, 'flex-direction'],
        [/^flex-(wrap|wrap-reverse|nowrap)$/, 'flex-wrap'],
        [/^justify-/, 'justify-content'], [/^items-/, 'align-items'],
        [/^gap-/, 'gap'], [/^rounded/, 'border-radius'], [/^border($|-[0-9])/, 'border-width'],
        [/^opacity-/, 'opacity'], [/^(static|fixed|absolute|relative|sticky)$/, 'position'],
        [/^overflow-/, 'overflow'], [/^z-/, 'z-index'],
    ];
    for (const [pattern, category] of patterns) {
        if (pattern.test(className))
            return category;
    }
    return null;
}
function smartMergeClasses(existing, newOnes) {
    const result = [...existing];
    for (const nc of newOnes) {
        const cat = getTailwindCategory(nc);
        if (cat) {
            for (let i = result.length - 1; i >= 0; i--) {
                if (getTailwindCategory(result[i]) === cat)
                    result.splice(i, 1);
            }
        }
        if (!result.includes(nc))
            result.push(nc);
    }
    return result;
}
function ClassesTab({ element, selectedElementId, selectedElements, onUpdateElementProps, onUpdateMultipleElementsProps, readOnly, }) {
    const isMultiSelect = selectedElements && selectedElements.length > 1;
    const [newClass, setNewClass] = useState("");
    const inputRef = useRef(null);
    // For multi-select, compute classes with their occurrence count
    const getClassesWithCounts = () => {
        if (!isMultiSelect || !selectedElements)
            return [];
        const classCounts = {};
        const total = selectedElements.length;
        for (const el of selectedElements) {
            if (el.type === 'text')
                continue;
            const className = el.props?.className || '';
            const classes = className.split(/\s+/).filter(Boolean);
            for (const cls of classes) {
                classCounts[cls] = (classCounts[cls] || 0) + 1;
            }
        }
        return Object.entries(classCounts)
            .map(([cls, count]) => ({ cls, count, total }))
            .sort((a, b) => b.count - a.count || a.cls.localeCompare(b.cls));
    };
    const getClasses = () => {
        if (!element || element.type === 'text')
            return [];
        const className = element.props?.className || '';
        return className.split(/\s+/).filter(Boolean);
    };
    const classes = getClasses();
    const classesWithCounts = isMultiSelect ? getClassesWithCounts() : [];
    const handleAddClass = () => {
        if (!newClass.trim() || readOnly)
            return;
        const classesToAdd = newClass.trim().split(/\s+/).filter(Boolean);
        if (isMultiSelect && onUpdateMultipleElementsProps && selectedElements) {
            const ids = new Set(selectedElements.map(el => el.id));
            onUpdateMultipleElementsProps(ids, (currentProps) => {
                const currentClassName = currentProps?.className || '';
                const existingClasses = currentClassName.split(/\s+/).filter(Boolean);
                const merged = smartMergeClasses(existingClasses, classesToAdd);
                return { ...currentProps, className: merged.join(' ') };
            });
        }
        else if (onUpdateElementProps) {
            const updated = smartMergeClasses(classes, classesToAdd);
            onUpdateElementProps(selectedElementId, {
                ...(element?.props || {}),
                className: updated.join(' ')
            });
        }
        setNewClass("");
        inputRef.current?.focus();
    };
    const handleRemoveClass = (cls) => {
        if (readOnly)
            return;
        if (isMultiSelect && onUpdateMultipleElementsProps && selectedElements) {
            const ids = new Set(selectedElements.map(el => el.id));
            onUpdateMultipleElementsProps(ids, (currentProps) => {
                const currentClassName = currentProps?.className || '';
                const existingClasses = currentClassName.split(/\s+/).filter(Boolean);
                const updated = existingClasses.filter((c) => c !== cls);
                return { ...currentProps, className: updated.join(' ') };
            });
        }
        else if (onUpdateElementProps) {
            const updated = classes.filter((c) => c !== cls);
            onUpdateElementProps(selectedElementId, {
                ...(element?.props || {}),
                className: updated.join(' ')
            });
        }
    };
    return (_jsxs("div", { className: "flex flex-col h-full", children: [_jsx("div", { className: "flex-1 overflow-auto p-3", children: isMultiSelect ? (classesWithCounts.length === 0 ? (_jsx("p", { className: "text-[11px] text-ed-muted-foreground", children: "No classes applied" })) : (_jsx("div", { className: "flex flex-wrap gap-1.5", children: classesWithCounts.map(({ cls, count, total }, i) => {
                        const isCommon = count === total;
                        const isMixed = count < total;
                        return (_jsxs("div", { className: cn("group flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono text-ed-foreground", isCommon ? "bg-ed-muted/50" : "bg-ed-muted/30 border border-dashed border-ed-border"), children: [_jsx("span", { className: cn("truncate max-w-[120px]", isMixed && "text-ed-muted-foreground"), children: cls }), isMixed && (_jsxs("span", { className: "text-[9px] text-ed-muted-foreground/70", children: ["(", count, "/", total, ")"] })), !readOnly && (_jsx("button", { onClick: () => handleRemoveClass(cls), className: "opacity-0 group-hover:opacity-100 hover:text-ed-destructive", children: _jsx(XIcon, { size: 12 }) }))] }, `${cls}-${i}`));
                    }) }))) : (classes.length === 0 ? (_jsx("p", { className: "text-[11px] text-ed-muted-foreground", children: "No classes applied" })) : (_jsx("div", { className: "flex flex-wrap gap-1.5", children: classes.map((cls, i) => (_jsxs("div", { className: "group flex items-center gap-1 px-2 py-1 rounded bg-ed-muted/50 text-[11px] font-mono text-ed-foreground", children: [_jsx("span", { className: "truncate max-w-[140px]", children: cls }), !readOnly && (_jsx("button", { onClick: () => handleRemoveClass(cls), className: "opacity-0 group-hover:opacity-100 hover:text-ed-destructive", children: _jsx(XIcon, { size: 12 }) }))] }, `${cls}-${i}`))) }))) }), !readOnly && (_jsx("div", { className: "border-t border-ed-border p-3", children: _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { ref: inputRef, type: "text", value: newClass, onChange: (e) => setNewClass(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleAddClass(), placeholder: isMultiSelect ? "Add class to all..." : "Add class...", className: "flex-1 h-8 px-3 text-[11px] bg-ed-muted/40 border border-transparent rounded hover:border-ed-border focus:border-ed-ring focus:outline-none text-ed-foreground" }), _jsx(Button, { variant: "default", size: "sm", onClick: handleAddClass, children: "Add" })] }) }))] }));
}
// ============================================================================
// CSS TAB
// ============================================================================
function CSSTab({ element, selectedElementId, selectedElements, onUpdateElementStyles, onUpdateMultipleElementsStyles, readOnly, }) {
    const isMultiSelect = selectedElements && selectedElements.length > 1;
    const styles = (element?.styles || {});
    // Convert camelCase to kebab-case
    const toKebab = (str) => str.replace(/([A-Z])/g, '-$1').toLowerCase();
    // Convert styles object to CSS string
    const stylesToCSS = (s) => {
        const entries = Object.entries(s).filter(([_, v]) => v !== undefined && v !== '');
        if (entries.length === 0)
            return '';
        return entries.map(([k, v]) => `${toKebab(k)}: ${v};`).join('\n');
    };
    // Convert CSS string to styles object
    const cssToStyles = (css) => {
        const result = {};
        const lines = css.split(/[;\n]/).filter(Boolean);
        for (const line of lines) {
            const [prop, ...valueParts] = line.split(':');
            if (prop && valueParts.length > 0) {
                const kebabProp = prop.trim();
                const value = valueParts.join(':').trim();
                // Convert kebab-case to camelCase
                const camelProp = kebabProp.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
                if (value)
                    result[camelProp] = value;
            }
        }
        return result;
    };
    // For multi-select, compute merged styles with mixed indicator
    const getMergedStylesCSS = () => {
        if (!isMultiSelect || !selectedElements)
            return stylesToCSS(styles);
        // Get all unique style properties across selected elements
        const allProps = new Set();
        for (const el of selectedElements) {
            const s = (el.styles || {});
            Object.keys(s).forEach(k => allProps.add(k));
        }
        const lines = [];
        for (const prop of Array.from(allProps).sort()) {
            const merged = getMergedValue(selectedElements, (el) => el.styles?.[prop]);
            if (isMixed(merged)) {
                lines.push(`${toKebab(prop)}: Mixed;`);
            }
            else if (merged !== undefined && merged !== '') {
                lines.push(`${toKebab(prop)}: ${merged};`);
            }
        }
        return lines.join('\n');
    };
    const initialCSS = isMultiSelect ? getMergedStylesCSS() : stylesToCSS(styles);
    const [localCSS, setLocalCSS] = useState(initialCSS);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (isMultiSelect) {
            setLocalCSS(getMergedStylesCSS());
        }
        else {
            setLocalCSS(stylesToCSS(styles));
        }
    }, [element?.id, JSON.stringify(styles), isMultiSelect, selectedElements?.map(e => e.id).join(',')]);
    const handleApply = () => {
        if (readOnly)
            return;
        try {
            const newStyles = cssToStyles(localCSS);
            // Filter out "Mixed" values - don't apply them
            const filteredStyles = {};
            for (const [k, v] of Object.entries(newStyles)) {
                if (v !== 'Mixed') {
                    filteredStyles[k] = v;
                }
            }
            if (isMultiSelect && onUpdateMultipleElementsStyles && selectedElements) {
                const ids = new Set(selectedElements.map(el => el.id));
                onUpdateMultipleElementsStyles(ids, (currentStyles) => ({
                    ...currentStyles,
                    ...filteredStyles
                }));
            }
            else {
                onUpdateElementStyles(selectedElementId, filteredStyles);
            }
            setError(null);
        }
        catch (e) {
            setError('Invalid CSS');
        }
    };
    const handleClear = () => {
        if (readOnly)
            return;
        if (isMultiSelect && onUpdateMultipleElementsStyles && selectedElements) {
            const ids = new Set(selectedElements.map(el => el.id));
            onUpdateMultipleElementsStyles(ids, () => ({}));
        }
        else {
            onUpdateElementStyles(selectedElementId, {});
        }
        setLocalCSS('');
    };
    if (!element && !isMultiSelect)
        return _jsx("p", { className: "p-3 text-[11px] text-ed-muted-foreground", children: "No element selected" });
    return (_jsxs("div", { className: "flex flex-col h-full", children: [_jsxs("div", { className: "flex-1 p-3", children: [_jsx("textarea", { value: localCSS, onChange: (e) => setLocalCSS(e.target.value), onKeyDown: (e) => {
                            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                e.preventDefault();
                                handleApply();
                            }
                        }, placeholder: isMultiSelect
                            ? "/* Styles shown for all selected elements */\n/* 'Mixed' = different values across selection */"
                            : "/* No inline styles */\nbackground-color: #fff;\npadding: 16px;", disabled: readOnly, className: cn("w-full h-full min-h-[200px] p-3 text-[11px] font-mono bg-ed-muted/40 rounded resize-none text-ed-foreground placeholder:text-ed-muted-foreground", "border border-transparent hover:border-ed-border focus:border-ed-ring focus:outline-none", error && "border-ed-destructive") }), error && _jsx("p", { className: "text-[10px] text-ed-destructive mt-1", children: error })] }), !readOnly && (_jsxs("div", { className: "border-t border-ed-border p-3 flex gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: handleClear, className: "flex-1", children: "Clear All" }), _jsx(Button, { variant: "default", size: "sm", onClick: handleApply, className: "flex-1", children: "Apply" })] }))] }));
}
// ============================================================================
// MAIN EXPORT
// ============================================================================
export default function StylesPanelTabs({ selectedElementId, selectedElementIds = new Set(), elements, onUpdateElementStyles, onUpdateElementProps, onUpdateMultipleElementsProps, onUpdateMultipleElementsStyles, onCreateComponent, renderMode = 'felement', readOnly = false, }) {
    const element = selectedElementId ? findElement(elements, selectedElementId) : null;
    const isMultiSelect = selectedElementIds.size > 1;
    // Get selected elements for multi-select mode
    const selectedElements = React.useMemo(() => {
        if (!isMultiSelect)
            return undefined;
        const result = [];
        for (const id of selectedElementIds) {
            const el = findElement(elements, id);
            if (el)
                result.push(el);
        }
        return result;
    }, [isMultiSelect, selectedElementIds, elements]);
    // Get element types summary for multi-select header
    const elementSummary = React.useMemo(() => {
        if (!isMultiSelect || !selectedElements)
            return '';
        const types = {};
        for (const el of selectedElements) {
            const type = el.type === 'html' ? el.tag : el.type;
            types[type] = (types[type] || 0) + 1;
        }
        return Object.entries(types)
            .map(([type, count]) => `${count} ${type}`)
            .join(', ');
    }, [isMultiSelect, selectedElements]);
    if (!selectedElementId && !isMultiSelect) {
        return (_jsxs("div", { className: "h-full flex flex-col overflow-hidden", children: [_jsx("div", { className: "border-b border-ed-border p-3", children: _jsx("h3", { className: "text-sm font-medium text-ed-foreground", children: "Styles" }) }), _jsx("div", { className: "flex-1 flex items-center justify-center p-4", children: _jsx("p", { className: "text-[11px] text-ed-muted-foreground text-center", children: "Select an element" }) })] }));
    }
    const tagName = element?.type === 'html'
        ? element.tag
        : element?.type === 'text' ? 'text' : element?.type;
    return (_jsxs("div", { className: "h-full flex flex-col overflow-hidden", children: [_jsxs("div", { className: "border-b border-ed-border p-3 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-ed-foreground", children: "Styles" }), _jsx("p", { className: "text-[10px] text-ed-muted-foreground mt-0.5", children: isMultiSelect
                                    ? `${selectedElementIds.size} elements (${elementSummary})`
                                    : `<${tagName}>` })] }), onCreateComponent && renderMode === 'felement' && !readOnly && !isMultiSelect && (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "icon", onClick: onCreateComponent, children: _jsx(DiamondsFourIcon, { size: 18, weight: "duotone" }) }) }), _jsx(TooltipContent, { children: "Create Component" })] }))] }), _jsxs(Tabs, { defaultValue: "design", className: "flex-1 flex flex-col overflow-hidden", children: [_jsxs(TabsList, { className: "w-full p-2", variant: "simple", children: [_jsx(TabsTrigger, { value: "design", children: "Design" }), _jsx(TabsTrigger, { value: "css", children: "CSS" }), _jsx(TabsTrigger, { value: "classes", children: "Classes" })] }), _jsx(TabsContent, { value: "design", className: "flex-1 overflow-hidden mt-0", children: _jsx(DesignTab, { element: element, selectedElementId: selectedElementId || Array.from(selectedElementIds)[0], selectedElements: selectedElements, onUpdateElementStyles: onUpdateElementStyles, onUpdateMultipleElementsStyles: onUpdateMultipleElementsStyles, readOnly: readOnly }) }), _jsx(TabsContent, { value: "css", className: "flex-1 overflow-hidden mt-0", children: _jsx(CSSTab, { element: element, selectedElementId: selectedElementId || Array.from(selectedElementIds)[0], selectedElements: selectedElements, onUpdateElementStyles: onUpdateElementStyles, onUpdateMultipleElementsStyles: onUpdateMultipleElementsStyles, readOnly: readOnly }) }), _jsx(TabsContent, { value: "classes", className: "flex-1 overflow-hidden mt-0", children: _jsx(ClassesTab, { element: element, selectedElementId: selectedElementId || Array.from(selectedElementIds)[0], selectedElements: selectedElements, onUpdateElementProps: onUpdateElementProps, onUpdateMultipleElementsProps: onUpdateMultipleElementsProps, readOnly: readOnly }) })] })] }));
}
