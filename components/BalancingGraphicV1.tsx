export function BalancingGraphicV1() {
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
      {/* Scheduler box */}
      <div
        style={{
          width: "400px",
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
          <span style={{ color: "#a1a1aa", fontSize: "14px" }}>scheduler.yaml</span>
          <div style={{ display: "flex", gap: "6px" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#3f3f46" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#3f3f46" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#3f3f46" }} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <p style={{ margin: 0 }}>
            <span style={{ color: "#a1a1aa" }}>policy: </span>
            <span style={{ color: "#93c5fd", fontWeight: 600 }}>dynamic-share</span>
          </p>
          <p style={{ margin: 0 }}>
            <span style={{ color: "#a1a1aa" }}>gpu_pool: </span>
            <span style={{ color: "#facc15", fontWeight: 600 }}>512</span>
          </p>
          <p style={{ margin: 0 }}>
            <span style={{ color: "#a1a1aa" }}>rebalance_interval: </span>
            <span style={{ color: "#c4b5fd", fontWeight: 600 }}>30s</span>
          </p>
        </div>
      </div>

      {/* Connector line */}
      <div
        style={{ width: 2, height: 40 }}
        className="bg-gradient-to-b from-[#313135] to-[#a1a1aa]"
      />

      {/* GPU Pool visualization */}
      <div
        style={{
          width: "400px",
          padding: "20px",
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
          <span style={{ color: "#d4d4d8", fontSize: "14px", fontWeight: 600 }}>GPU Pool — 512 GPUs</span>
          <span style={{ color: "#a1a1aa", fontSize: "12px" }}>live</span>
        </div>

        {/* Training bar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "rgb(251, 191, 36)", fontSize: "13px" }}>Training</span>
            <span style={{ color: "#a1a1aa", fontSize: "13px" }}>384 GPUs</span>
          </div>
          <div style={{ width: "100%", height: "32px", backgroundColor: "#101013", borderRadius: "8px", overflow: "hidden", display: "flex" }}>
            <div
              style={{
                width: "75%",
                height: "100%",
                backgroundImage: "linear-gradient(to right, #92400e, #fbbf24)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                paddingLeft: "12px",
              }}
            >
              <span style={{ color: "#451a03", fontSize: "12px", fontWeight: 700 }}>llama-405b-pretrain</span>
            </div>
          </div>
        </div>

        {/* Inference bar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#f472b6", fontSize: "13px" }}>Inference</span>
            <span style={{ color: "#a1a1aa", fontSize: "13px" }}>96 GPUs</span>
          </div>
          <div style={{ width: "100%", height: "32px", backgroundColor: "#101013", borderRadius: "8px", overflow: "hidden", display: "flex" }}>
            <div
              style={{
                width: "18.75%",
                height: "100%",
                backgroundImage: "linear-gradient(to right, #831843, #f472b6)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                paddingLeft: "12px",
              }}
            >
              <span style={{ color: "#fce7f3", fontSize: "12px", fontWeight: 700 }}>serve</span>
            </div>
          </div>
        </div>

        {/* Idle bar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#a1a1aa", fontSize: "13px" }}>Idle</span>
            <span style={{ color: "#a1a1aa", fontSize: "13px" }}>32 GPUs</span>
          </div>
          <div style={{ width: "100%", height: "32px", backgroundColor: "#101013", borderRadius: "8px", overflow: "hidden", display: "flex" }}>
            <div
              style={{
                width: "6.25%",
                height: "100%",
                backgroundColor: "#27272a",
                borderRadius: "8px",
              }}
            />
          </div>
        </div>

        {/* Rebalance indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "4px" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#34d399" }} />
          <span style={{ color: "#6ee7b7", fontSize: "12px" }}>Rebalancing in 12s — inference scaling up</span>
        </div>
      </div>
    </div>
  );
}
