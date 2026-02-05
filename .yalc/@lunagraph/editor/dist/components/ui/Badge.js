import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "../../lib/utils";
function Badge({ className, variant = "default", ...props }) {
    return (_jsx("div", { className: cn("inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium transition-colors", {
            "bg-ed-primary text-ed-primary-foreground": variant === "default",
            "bg-ed-secondary text-ed-secondary-foreground": variant === "secondary",
            "border border-ed-border bg-ed-background text-ed-foreground": variant === "outline",
            "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400": variant === "warning",
        }, className), ...props }));
}
export { Badge };
