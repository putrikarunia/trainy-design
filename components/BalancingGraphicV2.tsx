export function BalancingGraphicV2() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0px",
      }}
    >
      {/* TOP: scheduler.yaml config block — mono font only here */}
      <div
        style={{
          width: "420px",
          padding: "16px",
          border: "1px solid #2a2a2a",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          backgroundImage: "linear-gradient(to bottom right, #262631, #181820)",
          fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#a1a1aa", fontSize: "14px" }}>scheduler.yaml</span>
          <div style={{ display: "flex", gap: "6px" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#3f3f46" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#3f3f46" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#3f3f46" }} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <p style={{ margin: 0 }}>
            <span style={{ color: "#a1a1aa" }}>gpus: </span>
            <span style={{ color: "#facc15", fontWeight: 600 }}>512</span>
            <span style={{ color: "#a1a1aa" }}> × </span>
            <span style={{ color: "#93c5fd", fontWeight: 600 }}>H100</span>
          </p>
          <p style={{ margin: 0 }}>
            <span style={{ color: "#a1a1aa" }}>scheduler: </span>
            <span style={{ color: "#c4b5fd", fontWeight: 600 }}>demand-aware</span>
          </p>
          <p style={{ margin: 0 }}>
            <span style={{ color: "#a1a1aa" }}>policy: </span>
            <span style={{ color: "#34d399", fontWeight: 600 }}>dynamic-rebalance</span>
          </p>
          <p style={{ margin: 0 }}>
            <span style={{ color: "#a1a1aa" }}>priority: </span>
            <span style={{ color: "#f472b6", fontWeight: 600 }}>inference-first</span>
          </p>
        </div>
      </div>

      {/* Connector from config to dashboard */}
      <div style={{ width: 2, height: 32, background: "linear-gradient(to bottom, #313135, #52525b)" }} />

      {/* MID: Dashboard-style demand panel — SANS-SERIF font */}
      <div
        style={{
          width: "420px",
          padding: "8px",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          backgroundColor: "#161618",
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
        className="border shadow-2xl border-white/5"
      >
        {/* Stat cards row */}
        <div style={{ display: "flex", gap: "8px" }}>
          <div
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
            }}
            className="bg-gradient-to-tr from-[#101013] to-[#181820] border"
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center" }}>
              <span style={{ color: "#fafafa", fontSize: "18px", fontWeight: 600 }}>448</span>
              <span style={{ color: "#a1a1aa", fontSize: "11px" }}>Training GPUs</span>
            </div>
          </div>
          <div
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
            }}
            className="bg-gradient-to-tr from-[#101013] to-[#181820] border"
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center" }}>
              <span style={{ color: "#fafafa", fontSize: "18px", fontWeight: 600 }}>64</span>
              <span style={{ color: "#a1a1aa", fontSize: "11px" }}>Inference GPUs</span>
            </div>
          </div>
          <div
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
            }}
            className="bg-gradient-to-tr from-[#101013] to-[#181820] border"
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center" }}>
              <span style={{ color: "#fafafa", fontSize: "18px", fontWeight: 600 }}>87.5%</span>
              <span style={{ color: "#a1a1aa", fontSize: "11px" }}>Utilization</span>
            </div>
          </div>
        </div>

        {/* Demand + Actions panels */}
        <div style={{ display: "flex", gap: "8px" }}>
          <div
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
            }}
            className="bg-gradient-to-tr from-[#000000] to-[#181820] border"
          >
            <div style={{ marginBottom: 12 }}>
              <span style={{ color: "#fafafa", fontSize: "13px", fontWeight: 500 }}>Demand</span>
            </div>
            {/* Training row */}
            <div style={{ padding: "6px 0" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#f0f0f5", fontSize: "13px", fontWeight: 500 }}>Training</span>
                  <span style={{ color: "#34d399", padding: "2px 10px", fontSize: "11px", background: "rgba(52,211,153,0.1)", fontWeight: 500, borderRadius: "8px" }}>● high</span>
                </div>
                <span style={{ color: "#a1a1aa", fontSize: "11px" }}>448 GPUs allocated</span>
              </div>
            </div>
            {/* Inference row — arrow up instead of circle */}
            <div style={{ padding: "6px 0" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#f0f0f5", fontSize: "13px", fontWeight: 500 }}>Inference</span>
                  <span style={{ color: "#f472b6", padding: "2px 10px", fontSize: "11px", background: "rgba(244,114,182,0.1)", fontWeight: 500, borderRadius: "8px" }}>↑ spiking</span>
                </div>
                <span style={{ color: "#a1a1aa", fontSize: "11px" }}>64 GPUs allocated</span>
              </div>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
            }}
            className="bg-gradient-to-tr from-[#101013] to-[#181820] border"
          >
            <div style={{ marginBottom: 12 }}>
              <span style={{ color: "#fafafa", fontSize: "13px", fontWeight: 500 }}>Actions</span>
            </div>
            <div style={{ padding: "6px 0" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#f0f0f5", fontSize: "13px", fontWeight: 500 }}>Rebalancing</span>
                  <span style={{ color: "#34d399", padding: "2px 10px", fontSize: "11px", background: "rgba(52,211,153,0.1)", fontWeight: 500, borderRadius: "8px" }}>● active</span>
                </div>
                <span style={{ color: "#a1a1aa", fontSize: "11px" }}>64 GPUs → inference</span>
              </div>
            </div>
            <div style={{ padding: "6px 0" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ color: "#f0f0f5", fontSize: "13px", fontWeight: 500 }}>Cooldown</span>
                <span style={{ color: "#a1a1aa", fontSize: "11px" }}>Next check in 5m</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connector: single SVG fork from dashboard center to each GPU card center */}
      <svg width="384" height="64" viewBox="0 0 384 64" fill="none" style={{ overflow: "visible" }}>
        {/* Vertical line down from center */}
        <line x1="192" y1="0" x2="192" y2="24" stroke="#52525b" strokeWidth="2" />
        {/* Horizontal bar */}
        <line x1="90" y1="24" x2="294" y2="24" stroke="#52525b" strokeWidth="2" />
        {/* Left branch down to Training card center — gradient via defs */}
        <defs>
          <linearGradient id="gradLeft" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#52525b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="gradRight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#52525b" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
        <line x1="90" y1="24" x2="90" y2="64" stroke="url(#gradLeft)" strokeWidth="2" />
        {/* Right branch down to Inference card center */}
        <line x1="294" y1="24" x2="294" y2="64" stroke="url(#gradRight)" strokeWidth="2" />
      </svg>

      {/* BOTTOM: GPU node cards */}
      <div style={{ display: "flex", gap: "24px", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        {/* Training nodes */}
        <div
          style={{
            width: "180px",
            height: "140px",
            border: "1px solid rgba(251, 191, 36, 0.3)",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            backgroundImage: "linear-gradient(to top right, #101013, #181820)",
            opacity: 0.7,
          }}
        >
          <span style={{ color: "#a1a1aa", fontSize: "20px", fontWeight: 600, letterSpacing: "0.025em" }}>448 GPUs</span>
          <div style={{ padding: "2px 10px", borderRadius: "8px", backgroundColor: "rgb(69, 26, 3)" }}>
            <span style={{ color: "rgb(251, 191, 36)", fontSize: "14px", fontWeight: 500 }}>Training</span>
          </div>
          <div style={{ display: "flex", gap: "3px", flexWrap: "wrap", justifyContent: "center", width: "130px" }}>
            {/* 14 active + 2 idle GPU dots */}
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundImage: "linear-gradient(135deg, #f59e0b, #fbbf24)", boxShadow: "0 0 6px rgba(251,191,36,0.4)" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundImage: "linear-gradient(135deg, #f59e0b, #fbbf24)", boxShadow: "0 0 6px rgba(251,191,36,0.4)" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundImage: "linear-gradient(135deg, #f59e0b, #fbbf24)", boxShadow: "0 0 6px rgba(251,191,36,0.4)" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundImage: "linear-gradient(135deg, #f59e0b, #fbbf24)", boxShadow: "0 0 6px rgba(251,191,36,0.4)" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundImage: "linear-gradient(135deg, #f59e0b, #fbbf24)", boxShadow: "0 0 6px rgba(251,191,36,0.4)" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundImage: "linear-gradient(135deg, #f59e0b, #fbbf24)", boxShadow: "0 0 6px rgba(251,191,36,0.4)" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundImage: "linear-gradient(135deg, #f59e0b, #fbbf24)", boxShadow: "0 0 6px rgba(251,191,36,0.4)" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundImage: "linear-gradient(135deg, #f59e0b, #fbbf24)", boxShadow: "0 0 6px rgba(251,191,36,0.4)" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundImage: "linear-gradient(135deg, #f59e0b, #fbbf24)", boxShadow: "0 0 6px rgba(251,191,36,0.4)" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundImage: "linear-gradient(135deg, #f59e0b, #fbbf24)", boxShadow: "0 0 6px rgba(251,191,36,0.4)" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundImage: "linear-gradient(135deg, #f59e0b, #fbbf24)", boxShadow: "0 0 6px rgba(251,191,36,0.4)" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundImage: "linear-gradient(135deg, #f59e0b, #fbbf24)", boxShadow: "0 0 6px rgba(251,191,36,0.4)" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundImage: "linear-gradient(135deg, #f59e0b, #fbbf24)", boxShadow: "0 0 6px rgba(251,191,36,0.4)" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundImage: "linear-gradient(135deg, #f59e0b, #fbbf24)", boxShadow: "0 0 6px rgba(251,191,36,0.4)" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: "#27272a" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: "#27272a" }} />
          </div>
        </div>

        {/* Inference nodes */}
        <div
          style={{
            width: "180px",
            height: "140px",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            backgroundImage: "linear-gradient(to top right, #101013, #181820)",
            border: "1px solid rgba(244, 114, 182, 0.4)",
          }}
        >
          <span style={{ color: "#a1a1aa", fontSize: "20px", fontWeight: 600, letterSpacing: "0.025em" }}>64 GPUs</span>
          <div style={{ padding: "2px 10px", borderRadius: "8px", background: "rgba(244,114,182,0.1)" }}>
            <span style={{ color: "#f472b6", fontSize: "14px", fontWeight: 500 }}>Inference</span>
          </div>
          <div style={{ display: "flex", gap: "3px", flexWrap: "wrap", justifyContent: "center", width: "130px" }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundImage: "linear-gradient(135deg, #ec4899, #f472b6)", boxShadow: "0 0 6px rgba(244,114,182,0.4)" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundImage: "linear-gradient(135deg, #ec4899, #f472b6)", boxShadow: "0 0 6px rgba(244,114,182,0.4)" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundImage: "linear-gradient(135deg, #ec4899, #f472b6)", boxShadow: "0 0 6px rgba(244,114,182,0.4)" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundImage: "linear-gradient(135deg, #ec4899, #f472b6)", boxShadow: "0 0 6px rgba(244,114,182,0.4)" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundImage: "linear-gradient(135deg, #ec4899, #f472b6)", boxShadow: "0 0 6px rgba(244,114,182,0.4)" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundImage: "linear-gradient(135deg, #ec4899, #f472b6)", boxShadow: "0 0 6px rgba(244,114,182,0.4)" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: "#27272a" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: "#27272a" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: "#27272a" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: "#27272a" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: "#27272a" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: "#27272a" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: "#27272a" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: "#27272a" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: "#27272a" }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: "#27272a" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
