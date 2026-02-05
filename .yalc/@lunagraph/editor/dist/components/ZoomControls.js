import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useControls } from "react-zoom-pan-pinch";
import { Crosshair } from "@phosphor-icons/react";
export function ZoomControls({ zoom }) {
    const { zoomIn, zoomOut, setTransform } = useControls();
    const zoomPercentage = Math.round(zoom * 100);
    const handleRecenter = (e) => {
        e.stopPropagation();
        setTransform(0, 0, 1, 200); // x, y, scale, animation duration
    };
    return (_jsxs("div", { className: "absolute bottom-3 right-3 flex items-center gap-0.5 bg-ed-background border border-ed-border rounded-md shadow-sm px-1 py-0.5 pointer-events-auto z-50", children: [_jsx("button", { onClick: handleRecenter, className: "p-1 hover:bg-ed-muted rounded transition-colors", title: "Recenter (0,0 at 100%)", children: _jsx(Crosshair, { size: 12, weight: "bold", className: "text-ed-foreground" }) }), _jsx("div", { className: "w-px h-4 bg-ed-border mx-0.5" }), _jsx("button", { onClick: (e) => {
                    e.stopPropagation();
                    zoomOut();
                }, className: "px-1.5 py-0.5 hover:bg-ed-muted rounded transition-colors text-xs font-medium text-ed-foreground", title: "Zoom Out", children: "\u2212" }), _jsxs("span", { className: "text-[10px] font-medium min-w-[32px] text-center text-ed-muted-foreground", children: [zoomPercentage, "%"] }), _jsx("button", { onClick: (e) => {
                    e.stopPropagation();
                    zoomIn();
                }, className: "px-1.5 py-0.5 hover:bg-ed-muted rounded transition-colors text-xs font-medium text-ed-foreground", title: "Zoom In", children: "+" })] }));
}
