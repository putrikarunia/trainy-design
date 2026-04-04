"use client";

import { Badge } from "../ui/badge";

export function InferenceHeroGraphic() {
  return (
    <div className="flex flex-col items-center justify-center" style={{ gap: "-1px" }}>
      {/* YAML Config Card */}
      <div
        className="rounded-2xl flex flex-col items-start justify-center border border-white/10 backdrop-blur-[15px] font-mono text-xs lg:text-base"
        style={{
          padding: "16px",
          gap: "16px",
          width: "100%",
          maxWidth: "400px",
          background: "linear-gradient(to bottom right, #262631, #181820)",
        }}
      >
        <div className="flex justify-between items-center w-full">
          <span style={{ color: "#a1a1aa", fontSize: "14px" }}>job.yaml</span>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-zinc-700" />
            <div className="w-3 h-3 rounded-full bg-zinc-700" />
            <div className="w-3 h-3 rounded-full bg-zinc-700" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="m-0 text-zinc-300">
            <span className="text-zinc-500">num_nodes: </span>
            <span className="text-yellow-400 font-semibold">64</span>
          </p>
          <p className="m-0 text-zinc-300">
            <span className="text-zinc-500">accelerators: </span>
            <span className="text-blue-300 font-semibold">H100:8</span>
          </p>
          <p className="m-0 text-zinc-300">
            <span className="text-zinc-500">priority-class: </span>
            <span className="text-violet-300 font-semibold">high-priority</span>
          </p>
          <p className="m-0 text-zinc-500">serving:</p>
          <p className="m-0 text-zinc-300 pl-4">
            <span className="text-zinc-500">min_replicas: </span>
            <span className="text-yellow-400 font-semibold">3</span>
          </p>
        </div>
      </div>

      {/* Connector line */}
      <div className="w-0.5 h-10 bg-gradient-to-b from-zinc-700 to-amber-400" />

      {/* Branch top */}
      <div className="relative flex items-center justify-center border-2 rounded-t-xl border-b-0 border-amber-400" style={{ width: "350px", height: "20px" }} />

      {/* GPU Nodes */}
      <div className="flex flex-row gap-6">
        {/* Training node 1 */}
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-2.5 bg-gradient-to-b from-amber-400 to-amber-200" />
          <div
            className="relative rounded-xl flex flex-col items-center justify-center bg-gradient-to-tr from-zinc-950 to-zinc-900 shadow-xl border border-zinc-800 opacity-70"
            style={{ width: "150px", height: "150px", gap: "8px" }}
          >
            <span className="text-xl text-zinc-500">8x GPUs</span>
            <div className="flex px-2 py-0.5 rounded-lg" style={{ backgroundColor: "rgb(69, 26, 3)" }}>
              <span className="text-yellow-400 text-sm">Training</span>
            </div>
          </div>
        </div>

        {/* Training node 2 */}
        <div className="flex flex-col items-center" style={{ marginTop: "-20px" }}>
          <div className="w-0.5 h-[30px] bg-gradient-to-b from-amber-400 to-amber-200" />
          <div
            className="relative rounded-xl flex flex-col items-center justify-center bg-gradient-to-tr from-zinc-950 to-zinc-900 shadow-xl border border-zinc-800 opacity-70"
            style={{ width: "150px", height: "150px", gap: "16px" }}
          >
            <span className="text-xl text-zinc-500">8x GPUs</span>
            <div className="flex px-2 py-0.5 rounded-lg" style={{ backgroundColor: "rgb(69, 26, 3)" }}>
              <span className="text-yellow-400 text-sm">Training</span>
            </div>
          </div>
        </div>

        {/* Inference node */}
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-2.5 bg-gradient-to-b from-amber-400 to-amber-200" />
          <div
            className="relative rounded-xl flex flex-col items-center justify-center bg-gradient-to-tr from-zinc-950 to-zinc-900 shadow-xl border border-pink-400"
            style={{ width: "150px", height: "150px", gap: "16px" }}
          >
            <span className="text-xl text-zinc-500">8x GPUs</span>
            <div className="flex px-2 py-0.5 rounded-lg bg-pink-400/10">
              <span className="text-pink-400 text-sm">Inference</span>
            </div>
          </div>
          <div className="w-0.5 h-5 bg-gradient-to-b from-pink-900 to-pink-400" />
        </div>
      </div>

      {/* Bottom branch connector */}
      <div className="flex flex-row" style={{ marginLeft: "174px" }}>
        <div
          className="relative flex items-center justify-center border-2 border-pink-400 border-b-0 border-r-0 rounded-tl-xl"
          style={{ width: "89px", height: "20px", marginTop: "18px" }}
        />
        <div
          className="relative flex items-center justify-center border-t-0 border-2 border-pink-400 rounded-br-xl border-l-0"
          style={{ width: "87px", height: "20px" }}
        />
      </div>

      {/* Connector line bottom */}
      <div className="w-0.5 h-5 bg-gradient-to-b from-pink-400 to-pink-200" />

      {/* Status card */}
      <div
        className="relative rounded-xl text-sm leading-relaxed shadow-xl border font-mono w-full"
        style={{
          padding: "24px",
          background: "linear-gradient(to bottom right, #262631, #181820)",
        }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="flex-1 text-pink-400">llama-70b-serve</span>
            <Badge variant="outline">
              <span className="text-emerald-400">●</span> Live
            </Badge>
          </div>
          <div className="text-gray-300">Replicas: 3 → 5 (autoscaling)</div>
          <div className="text-gray-300">Latency: 42ms | 1.2K req/sec</div>
          <div className="text-gray-300">Health: All nodes passing</div>
        </div>
      </div>
    </div>
  );
}
