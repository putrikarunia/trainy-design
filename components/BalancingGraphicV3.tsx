export function BalancingGraphicV3() {
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
          <span style={{ color: "#a1a1aa", fontSize: "14px" }}>cluster.yaml</span>
          <div style={{ display: "flex", gap: "6px" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#3f3f46" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#3f3f46" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#3f3f46" }} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <p style={{ margin: 0 }}>
            <span style={{ color: "#a1a1aa" }}>mode: </span>
            <span style={{ color: "#93c5fd", fontWeight: 600 }}>unified-pool</span>
          </p>
          <p style={{ margin: 0 }}>
            <span style={{ color: "#a1a1aa" }}>total_gpus: </span>
            <span style={{ color: "#facc15", fontWeight: 600 }}>512</span>
          </p>
          <p style={{ margin: 0 }}>
            <span style={{ color: "#a1a1aa" }}>scaling: </span>
            <span style={{ color: "#c4b5fd", fontWeight: 600 }}>auto</span>
          </p>
          <p style={{ margin: 0 }}>
            <span style={{ color: "#a1a1aa" }}>idle_policy: </span>
            <span style={{ color: "#34d399", fontWeight: 600 }}>reclaim</span>
          </p>
        </div>
      </div>

      {/* Connector */}
      <div style={{ width: 2, height: 32 }} className="bg-gradient-to-b from-[#313135] to-[#a1a1aa]" />

      {/* Timeline visualization */}
      <div
        style={{
          width: "420px",
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
        <span style={{ color: "#d4d4d8", fontSize: "13px", fontWeight: 600 }}>GPU Allocation Over Time</span>

        {/* Timeline rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Time labels */}
          <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "50px" }}>
            <span style={{ color: "#52525b", fontSize: "10px" }}>00:00</span>
            <span style={{ color: "#52525b", fontSize: "10px" }}>06:00</span>
            <span style={{ color: "#52525b", fontSize: "10px" }}>12:00</span>
            <span style={{ color: "#52525b", fontSize: "10px" }}>18:00</span>
            <span style={{ color: "#52525b", fontSize: "10px" }}>now</span>
          </div>

          {/* Training timeline */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#fbbf24", fontSize: "11px", width: "50px", textAlign: "right" }}>Train</span>
            <div style={{ flex: 1, height: "28px", backgroundColor: "#101013", borderRadius: "6px", overflow: "hidden", display: "flex" }}>
              <div style={{ width: "90%", height: "100%", backgroundImage: "linear-gradient(to right, #92400e, #b45309)", borderRadius: "6px" }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#fbbf24", fontSize: "11px", width: "50px", textAlign: "right" }}>Train</span>
            <div style={{ flex: 1, height: "28px", backgroundColor: "#101013", borderRadius: "6px", overflow: "hidden", display: "flex" }}>
              <div style={{ width: "65%", height: "100%", backgroundImage: "linear-gradient(to right, #92400e, #b45309)", borderRadius: "6px" }} />
              {/* Gap where GPUs were reclaimed */}
              <div style={{ width: "5%", height: "100%", backgroundColor: "#101013" }} />
              <div style={{ width: "20%", height: "100%", backgroundImage: "linear-gradient(to right, #92400e, #78350f)", borderRadius: "6px" }} />
            </div>
          </div>

          {/* Inference timeline */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#f472b6", fontSize: "11px", width: "50px", textAlign: "right" }}>Infer</span>
            <div style={{ flex: 1, height: "28px", backgroundColor: "#101013", borderRadius: "6px", overflow: "hidden", display: "flex" }}>
              <div style={{ width: "10%", height: "100%" }} />
              <div style={{ width: "15%", height: "100%", backgroundImage: "linear-gradient(to right, #831843, #be185d)", borderRadius: "6px" }} />
              <div style={{ width: "20%", height: "100%" }} />
              <div style={{ width: "30%", height: "100%", backgroundImage: "linear-gradient(to right, #831843, #db2777)", borderRadius: "6px" }} />
              <div style={{ width: "5%", height: "100%" }} />
              <div style={{ width: "20%", height: "100%", backgroundImage: "linear-gradient(to right, #831843, #be185d)", borderRadius: "6px" }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#f472b6", fontSize: "11px", width: "50px", textAlign: "right" }}>Infer</span>
            <div style={{ flex: 1, height: "28px", backgroundColor: "#101013", borderRadius: "6px", overflow: "hidden", display: "flex" }}>
              <div style={{ width: "25%", height: "100%" }} />
              <div style={{ width: "10%", height: "100%", backgroundImage: "linear-gradient(to right, #831843, #be185d)", borderRadius: "6px" }} />
              <div style={{ width: "15%", height: "100%" }} />
              <div style={{ width: "50%", height: "100%", backgroundImage: "linear-gradient(to right, #831843, #db2777)", borderRadius: "6px" }} />
            </div>
          </div>

          {/* Idle row */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#52525b", fontSize: "11px", width: "50px", textAlign: "right" }}>Idle</span>
            <div style={{ flex: 1, height: "28px", backgroundColor: "#101013", borderRadius: "6px", overflow: "hidden", display: "flex" }}>
              <div style={{ width: "5%", height: "100%", backgroundColor: "#27272a", borderRadius: "6px" }} />
              <div style={{ width: "10%", height: "100%" }} />
              <div style={{ width: "8%", height: "100%", backgroundColor: "#27272a", borderRadius: "6px" }} />
              <div style={{ width: "30%", height: "100%" }} />
              <div style={{ width: "3%", height: "100%", backgroundColor: "#27272a", borderRadius: "6px" }} />
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", paddingTop: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundImage: "linear-gradient(to right, #92400e, #b45309)" }} />
            <span style={{ color: "#a1a1aa", fontSize: "11px" }}>Training</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundImage: "linear-gradient(to right, #831843, #db2777)" }} />
            <span style={{ color: "#a1a1aa", fontSize: "11px" }}>Inference</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: "#27272a" }} />
            <span style={{ color: "#a1a1aa", fontSize: "11px" }}>Idle → reclaimed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
