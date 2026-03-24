"use client";

export default function GpuPoolGrid() {
  const training = 448;
  const inference = 64;
  const relocating = 64;
  const total = training + inference + relocating;

  const cells: Array<"training" | "inference" | "relocating"> = [];
  for (let i = 0; i < training; i++) cells.push("training");
  for (let i = 0; i < relocating; i++) cells.push("relocating");
  for (let i = 0; i < inference; i++) cells.push("inference");

  const colorMap = {
    training: "#ffc267",
    inference: "#f472b6",
    relocating: "#525252",
  };

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          width: "100%",
        }}
      >
        {cells.map((type, i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: 1,
              backgroundColor: colorMap[type],
              opacity: type === "relocating" ? 0.5 : 0.85,
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 10,
          fontSize: 10,
          color: "#a1a1aa",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: 1,
              backgroundColor: "#ffc267",
            }}
          />
          Training ({training})
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: 1,
              backgroundColor: "#f472b6",
            }}
          />
          Inference ({inference})
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: 1,
              backgroundColor: "#525252",
              opacity: 0.5,
            }}
          />
          Relocating ({relocating})
        </div>
      </div>
    </div>
  );
}
