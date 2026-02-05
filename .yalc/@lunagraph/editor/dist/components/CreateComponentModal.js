"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Text } from "./ui/Text";
import { Input } from "./ui/Input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "./ui/Dialog";
export function CreateComponentModal({ isOpen, onClose, onConfirm, }) {
    const [componentName, setComponentName] = useState("");
    const [error, setError] = useState("");
    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setComponentName("");
            setError("");
        }
    }, [isOpen]);
    const handleConfirm = () => {
        const trimmed = componentName.trim();
        // Validation
        if (!trimmed) {
            setError("Component name is required");
            return;
        }
        // Check PascalCase
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(trimmed)) {
            setError("Component name must be PascalCase (e.g., MyButton)");
            return;
        }
        onConfirm(trimmed);
        onClose();
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && componentName.trim()) {
            e.preventDefault();
            handleConfirm();
        }
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: (open) => !open && onClose(), children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Create Component" }), _jsx(DialogDescription, { children: "Extract the selected element into a reusable component" })] }), _jsx("div", { className: "space-y-4 py-4", children: _jsxs("div", { children: [_jsx("label", { htmlFor: "componentName", className: "block mb-2", children: _jsx(Text, { size: "sm", className: "text-ed-muted-foreground", children: "Component Name" }) }), _jsx(Input, { id: "componentName", type: "text", value: componentName, onChange: (e) => {
                                    setComponentName(e.target.value);
                                    setError("");
                                }, onKeyDown: handleKeyDown, placeholder: "MyButton", autoFocus: true, "aria-invalid": !!error }), error && (_jsx(Text, { size: "xs", className: "text-red-500 mt-1", children: error })), _jsx(Text, { size: "xs", className: "text-ed-muted-foreground mt-1", children: "Must be PascalCase (e.g., MyButton, CardHeader)" })] }) }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: onClose, children: "Cancel" }), _jsx(Button, { variant: "default", size: "sm", onClick: handleConfirm, disabled: !componentName.trim(), children: "Create Component" })] })] }) }));
}
