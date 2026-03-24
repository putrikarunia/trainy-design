export function BalancingGraphicV4() {
  // Isometric GPU grid - matching the screenshot style
  // Each GPU is a rounded square in isometric perspective
  // Colors: teal/green for inference, orange/coral for training, dark for idle

  const rows = 8;
  const cols = 8;
  const cellSize = 44;
  const gap = 6;

  // GPU states: 'idle' | 'training' | 'inference'
  const gpuStates: string[][] = [
    ['idle', 'idle', 'idle', 'idle', 'training', 'idle', 'idle', 'idle'],
    ['idle', 'idle', 'idle', 'idle', 'idle', 'idle', 'training', 'idle'],
    ['idle', 'idle', 'inference', 'idle', 'idle', 'training', 'training', 'idle'],
    ['idle', 'idle', 'idle', 'idle', 'inference', 'idle', 'idle', 'training'],
    ['idle', 'idle', 'idle', 'inference', 'idle', 'idle', 'training', 'idle'],
    ['idle', 'inference', 'idle', 'idle', 'idle', 'idle', 'idle', 'idle'],
    ['idle', 'idle', 'idle', 'idle', 'inference', 'training', 'idle', 'idle'],
    ['idle', 'idle', 'idle', 'idle', 'idle', 'idle', 'idle', 'idle'],
  ];

  const getGpuStyle = (state: string) => {
    const base = {
      width: cellSize,
      height: cellSize,
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative" as const,
      transition: "all 0.3s ease",
    };

    if (state === 'training') {
      return {
        ...base,
        backgroundImage: "linear-gradient(135deg, #fbbf24, #f97316)",
        boxShadow: "0 4px 20px rgba(251, 191, 36, 0.4), inset 0 -4px 8px rgba(120, 53, 15, 0.5)",
        border: "1px solid rgba(251, 191, 36, 0.3)",
      };
    }
    if (state === 'inference') {
      return {
        ...base,
        backgroundImage: "linear-gradient(135deg, #34d399, #06b6d4)",
        boxShadow: "0 4px 20px rgba(52, 211, 153, 0.4), inset 0 -4px 8px rgba(6, 78, 59, 0.5)",
        border: "1px solid rgba(52, 211, 153, 0.3)",
      };
    }
    return {
      ...base,
      backgroundImage: "linear-gradient(135deg, #1e1e28, #16161e)",
      boxShadow: "0 2px 6px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)",
      border: "1px solid #2a2a35",
    };
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0px",
        fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
      }}
    >
      {/* Config block */}
      <div
        style={{
          width: "420px",
          padding: "16px",
          backgroundColor: "#262631",
          border: "1px solid #2a2a2a",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          backgroundImage: "linear-gradient(to bottom right, #262631, #181820)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#a1a1aa", fontSize: "14px" }}>pool.yaml</span>
          <div style={{ display: "flex", gap: "6px" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#3f3f46" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#3f3f46" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#3f3f46" }} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <p style={{ margin: 0 }}>
            <span style={{ color: "#a1a1aa" }}>gpus: </span>
            <span style={{ color: "#facc15", fontWeight: 600 }}>64</span>
            <span style={{ color: "#a1a1aa" }}> × </span>
            <span style={{ color: "#93c5fd", fontWeight: 600 }}>H100</span>
          </p>
          <p style={{ margin: 0 }}>
            <span style={{ color: "#a1a1aa" }}>scheduler: </span>
            <span style={{ color: "#c4b5fd", fontWeight: 600 }}>demand-aware</span>
          </p>
          <p style={{ margin: 0 }}>
            <span style={{ color: "#a1a1aa" }}>zero_traffic: </span>
            <span style={{ color: "#34d399", fontWeight: 600 }}>scale-to-zero</span>
          </p>
        </div>
      </div>

      {/* Connector */}
      <div style={{ width: 2, height: 32 }} className="bg-gradient-to-b from-[#313135] to-[#a1a1aa]" />

      {/* Isometric GPU Grid */}
      <div
        style={{
          width: "440px",
          padding: "24px",
          backgroundColor: "#0d0d12",
          border: "1px solid #2a2a2a",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          backgroundImage: "radial-gradient(ellipse at center, #141420, #0d0d12)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
          <span style={{ color: "#d4d4d8", fontSize: "13px", fontWeight: 600 }}>Live GPU Pool</span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#34d399" }} />
            <span style={{ color: "#6ee7b7", fontSize: "11px" }}>48 / 64 active</span>
          </div>
        </div>

        {/* GPU Grid - flat top-down view with isometric feel via transform */}
        <div
          style={{
            transform: "perspective(800px) rotateX(25deg) rotateZ(-5deg)",
            display: "flex",
            flexDirection: "column",
            gap: `${gap}px`,
          }}
        >
          {gpuStates.map((row, rowIdx) => (
            <div key={rowIdx} style={{ display: "flex", gap: `${gap}px` }}>
              {row.map((state, colIdx) => (
                <div key={colIdx} style={getGpuStyle(state)}>
                  {state !== 'idle' && (
                    <div
                      style={{
                        width: cellSize * 0.55,
                        height: cellSize * 0.55,
                        borderRadius: "6px",
                        backgroundImage: state === 'training'
                          ? "linear-gradient(135deg, rgba(255,255,255,0.15), transparent)"
                          : "linear-gradient(135deg, rgba(255,255,255,0.15), transparent)",
                        filter: "blur(0.5px)",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "20px", paddingTop: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 4,
                backgroundImage: "linear-gradient(135deg, #fbbf24, #f97316)",
                boxShadow: "0 2px 8px rgba(251,191,36,0.3)",
              }}
            />
            <span style={{ color: "#fbbf24", fontSize: "12px" }}>Training (38)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 4,
                backgroundImage: "linear-gradient(135deg, #34d399, #06b6d4)",
                boxShadow: "0 2px 8px rgba(52,211,153,0.3)",
              }}
            />
            <span style={{ color: "#34d399", fontSize: "12px" }}>Inference (10)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 4,
                backgroundImage: "linear-gradient(135deg, #1e1e28, #16161e)",
                border: "1px solid #2a2a35",
              }}
            />
            <span style={{ color: "#52525b", fontSize: "12px" }}>Idle (16)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
