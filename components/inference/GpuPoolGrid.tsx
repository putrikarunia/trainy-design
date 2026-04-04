"use client";

export default function GpuPoolGrid() {
  const training = 448;
  const inference = 64;
  const relocating = 64;

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
    <div className="w-full">
      <div className="flex flex-wrap" style={{ gap: 2 }}>
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
        className="flex gap-4 mt-2.5 text-zinc-500 font-sans"
        style={{ fontSize: 10 }}
      >
        <div className="flex items-center gap-1">
          <div
            className="rounded-sm"
            style={{ width: 6, height: 6, backgroundColor: "#ffc267" }}
          />
          Training ({training})
        </div>
        <div className="flex items-center gap-1">
          <div
            className="rounded-sm"
            style={{ width: 6, height: 6, backgroundColor: "#f472b6" }}
          />
          Inference ({inference})
        </div>
        <div className="flex items-center gap-1">
          <div
            className="rounded-sm"
            style={{
              width: 6,
              height: 6,
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
