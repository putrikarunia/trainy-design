"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Text } from "./ui/Text";
import { Button } from "./ui/Button";
import { Plus, DotsThree, Trash, PencilSimple } from "@phosphor-icons/react";
import { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";
export function PagesPanel({ pages, activePageId, onSelectPage, onCreatePage, onRenamePage, onDeletePage, readOnly = false, }) {
    const [editingPageId, setEditingPageId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [menuOpenId, setMenuOpenId] = useState(null);
    const editInputRef = useRef(null);
    const menuRef = useRef(null);
    // Focus input when editing starts
    useEffect(() => {
        if (editingPageId && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingPageId]);
    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpenId(null);
            }
        };
        if (menuOpenId) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [menuOpenId]);
    const handleStartRename = (page) => {
        setEditingPageId(page.id);
        setEditingName(page.name);
        setMenuOpenId(null);
    };
    const handleConfirmRename = () => {
        if (editingPageId && editingName.trim() && onRenamePage) {
            onRenamePage(editingPageId, editingName.trim());
        }
        setEditingPageId(null);
        setEditingName("");
    };
    const handleCancelRename = () => {
        setEditingPageId(null);
        setEditingName("");
    };
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleConfirmRename();
        }
        else if (e.key === "Escape") {
            handleCancelRename();
        }
    };
    const handleDelete = (pageId) => {
        if (onDeletePage) {
            onDeletePage(pageId);
        }
        setMenuOpenId(null);
    };
    return (_jsxs("div", { className: "flex flex-col border-b border-ed-border", children: [_jsxs("div", { className: "flex items-center justify-between px-4 py-3", children: [_jsx(Text, { size: "xs", weight: "semibold", variant: "primary", children: "Pages" }), !readOnly && (_jsx(Button, { variant: "ghost", size: "icon-2xs", onClick: onCreatePage, title: "Create new page", children: _jsx(Plus, { size: 14, weight: "bold" }) }))] }), _jsx("div", { className: "pb-2", children: pages.map((page) => {
                    const isActive = page.id === activePageId;
                    const isEditing = editingPageId === page.id;
                    const isMenuOpen = menuOpenId === page.id;
                    return (_jsx("div", { className: cn("group flex items-center gap-2 px-4 py-1.5 cursor-pointer hover:bg-ed-accent/50 transition-colors relative", isActive && "bg-ed-accent font-medium"), onClick: () => !isEditing && onSelectPage(page.id), children: isEditing ? (_jsx("div", { className: "flex-1 flex items-center gap-1", children: _jsx("input", { ref: editInputRef, type: "text", value: editingName, onChange: (e) => setEditingName(e.target.value), onKeyDown: handleKeyDown, onBlur: handleConfirmRename, onClick: (e) => e.stopPropagation(), className: "flex-1 min-w-0 px-1.5 py-0.5 text-sm bg-ed-background border border-ed-border rounded outline-none focus:border-ed-primary text-ed-foreground" }) })) : (_jsxs(_Fragment, { children: [_jsx(Text, { size: "sm", variant: isActive ? "primary" : "secondary", className: "flex-1 truncate select-none", children: page.name }), !readOnly && (_jsxs("div", { className: "relative", children: [_jsx("button", { onClick: (e) => {
                                                e.stopPropagation();
                                                setMenuOpenId(isMenuOpen ? null : page.id);
                                            }, className: cn("opacity-0 group-hover:opacity-100 hover:bg-ed-accent rounded p-0.5 transition-opacity", isMenuOpen && "opacity-100"), children: _jsx(DotsThree, { size: 16, weight: "bold", className: "text-ed-muted-foreground" }) }), isMenuOpen && (_jsxs("div", { ref: menuRef, className: "absolute right-0 top-full mt-1 z-50 min-w-[120px] bg-ed-popover border border-ed-border rounded-md shadow-md py-1", children: [_jsxs("button", { onClick: (e) => {
                                                        e.stopPropagation();
                                                        handleStartRename(page);
                                                    }, className: "w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-ed-accent text-left", children: [_jsx(PencilSimple, { size: 14 }), "Rename"] }), pages.length > 1 && (_jsxs("button", { onClick: (e) => {
                                                        e.stopPropagation();
                                                        handleDelete(page.id);
                                                    }, className: "w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-ed-accent text-left text-red-600", children: [_jsx(Trash, { size: 14 }), "Delete"] }))] }))] }))] })) }, page.id));
                }) })] }));
}
