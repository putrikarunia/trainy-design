import { useControls } from "react-zoom-pan-pinch";
import { Crosshair } from "@phosphor-icons/react";

export function ZoomControls({ zoom }: { zoom: number }) {
  const { zoomIn, zoomOut, setTransform } = useControls();

  const zoomPercentage = Math.round(zoom * 100);

  const handleRecenter = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTransform(0, 0, 1, 200); // x, y, scale, animation duration
  };

  return (
    <div className="absolute bottom-3 right-3 flex items-center gap-0.5 bg-ed-background border border-ed-border rounded-md shadow-sm px-1 py-0.5 pointer-events-auto z-50">
      {/* Recenter button */}
      <button
        onClick={handleRecenter}
        className="p-1 hover:bg-ed-muted rounded transition-colors"
        title="Recenter (0,0 at 100%)"
      >
        <Crosshair size={12} weight="bold" className="text-ed-foreground" />
      </button>

      {/* Separator */}
      <div className="w-px h-4 bg-ed-border mx-0.5" />

      {/* Zoom out */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          zoomOut();
        }}
        className="px-1.5 py-0.5 hover:bg-ed-muted rounded transition-colors text-xs font-medium text-ed-foreground"
        title="Zoom Out"
      >
        −
      </button>

      {/* Zoom percentage */}
      <span className="text-[10px] font-medium min-w-[32px] text-center text-ed-muted-foreground">
        {zoomPercentage}%
      </span>

      {/* Zoom in */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          zoomIn();
        }}
        className="px-1.5 py-0.5 hover:bg-ed-muted rounded transition-colors text-xs font-medium text-ed-foreground"
        title="Zoom In"
      >
        +
      </button>
    </div>
  );
}
