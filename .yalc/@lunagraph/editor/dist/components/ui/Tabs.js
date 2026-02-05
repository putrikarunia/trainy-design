"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../../lib/utils";
const TabsListContext = React.createContext(null);
function Tabs({ className, ...props }) {
    return (_jsx(TabsPrimitive.Root, { "data-slot": "tabs", className: cn("flex flex-col", className), ...props }));
}
function TabsList({ className, variant = "default", ...props }) {
    return (_jsx(TabsListContext.Provider, { value: { variant }, children: _jsx(TabsPrimitive.List, { "data-slot": "tabs-list", "data-variant": variant, className: cn("inline-flex w-fit items-center justify-center", variant === "default" && "bg-ed-muted text-ed-muted-foreground h-9 rounded-lg p-1", variant === "simple" && "h-auto gap-2 border-b border-ed-border justify-start", className), ...props }) }));
}
function TabsTrigger({ className, ...props }) {
    const list = React.useContext(TabsListContext);
    const variant = list?.variant || "default";
    return (_jsx(TabsPrimitive.Trigger, { "data-slot": "tabs-trigger", className: cn("inline-flex items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-ring focus-visible:ring-offset-2", "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", variant === "default" && [
            "h-full flex-1 rounded-md border border-transparent px-3 py-1.5",
            "text-ed-muted-foreground hover:text-ed-foreground",
            "data-[state=active]:bg-ed-background data-[state=active]:text-ed-foreground data-[state=active]:shadow-sm",
        ], variant === "simple" && [
            "px-2 py-1 h-fit w-fit rounded text-xs",
            "text-ed-muted-foreground hover:text-ed-foreground",
            "data-[state=active]:text-ed-foreground",
            "data-[state=active]:bg-ed-secondary",
        ], className), ...props }));
}
function TabsContent({ className, ...props }) {
    return (_jsx(TabsPrimitive.Content, { "data-slot": "tabs-content", className: cn("flex-1 min-h-0 overflow-hidden outline-none", className), ...props }));
}
export { Tabs, TabsList, TabsTrigger, TabsContent };
