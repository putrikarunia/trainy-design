"use client";

import { TrendingDown, ArrowLeft } from "lucide-react";

export function AutoScaling() {
  return (
    <div className="w-full flex items-center justify-center px-4 py-8 lg:py-16">
      <div className="max-w-[1280px] w-full flex flex-col gap-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-12 items-center">
          {/* Left - Text */}
          <div className="flex flex-col gap-4">
            <div className="w-fit flex px-2 py-0.5 rounded-lg bg-pink-500/20">
              <span className="text-pink-400 text-sm leading-[21px]">
                Auto-scaling
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-medium text-foreground">
              Scale to zero. Actually zero.
            </h2>
            <p className="text-lg leading-[27px] text-zinc-500">
              Not just scale-down-to-one. Actual zero. No requests means no GPUs
              used. Those resources go straight back to training jobs. When
              requests come in, it scales back up automatically.
            </p>
          </div>

          {/* Right - GPU Allocation Graphic */}
          <div className="relative flex flex-col items-center">
            <div className="w-full border border-white/10 rounded-xl shadow-2xl overflow-hidden bg-[#161618]">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-700/50">
                <span className="text-zinc-100 text-[13px] font-medium">
                  GPU Allocation
                </span>
                <span className="text-zinc-600 text-[11px] font-mono">
                  512 GPUs total
                </span>
              </div>

              <div className="flex flex-col gap-2 p-2">
                {/* Training + Inference bars */}
                <div className="bg-gradient-to-tr from-black to-[#181820] border rounded-lg p-3 flex flex-col gap-4">
                  {/* Training */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: "rgba(196,155,60,0.8)",
                            boxShadow: "0 0 8px rgba(196,155,60,0.3)",
                          }}
                        />
                        <span className="text-xs text-zinc-100">Training</span>
                      </div>
                      <span className="font-mono text-zinc-100 text-sm">
                        468 GPUs
                      </span>
                    </div>
                    <div
                      className="w-full h-8 relative overflow-hidden rounded-sm"
                      style={{
                        border: "1px solid rgba(255,255,255,0.04)",
                        backgroundColor: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div
                        className="h-full rounded-sm"
                        style={{
                          width: "91.4%",
                          border: "1px solid rgba(196,155,60,0.3)",
                          boxShadow: "0 0 12px rgba(196,155,60,0.08)",
                          background:
                            "linear-gradient(90deg, rgba(196,155,60,0.45) 0%, rgba(196,155,60,0.35) 30%, rgba(196,155,60,0.2) 70%, rgba(196,155,60,0.1) 100%)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Inference */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            border: "1px solid rgba(190,70,120,0.3)",
                            backgroundColor: "rgba(190,70,120,0.4)",
                          }}
                        />
                        <span className="text-zinc-100 text-xs">Inference</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <TrendingDown size={10} className="text-zinc-500" />
                        <span className="font-mono text-sm">16 GPUs</span>
                      </div>
                    </div>
                    <div
                      className="w-full h-8 flex items-center overflow-hidden rounded-sm"
                      style={{
                        border: "1px solid rgba(255,255,255,0.04)",
                        backgroundColor: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div
                        className="h-full rounded-sm opacity-60"
                        style={{
                          width: "3.1%",
                          background:
                            "linear-gradient(90deg, rgba(190,70,120,0.6) 0%, rgba(190,70,120,0.3) 100%)",
                        }}
                      />
                      <ArrowLeft size={10} className="text-pink-400" />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-zinc-700/40" />

                {/* Scaling Down section */}
                <div className="bg-gradient-to-tr from-black to-[#181820] border rounded-lg p-3 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          boxShadow: "0 0 6px rgba(52,211,153,0.4)",
                          backgroundColor: "#34d399",
                        }}
                      />
                      <span className="text-zinc-100 text-xs font-medium">
                        Inference Scaling Down
                      </span>
                    </div>
                    <span className="text-emerald-400 text-[11px] font-mono">
                      12 req/s
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 border border-white/5 rounded-md p-2.5 flex flex-col gap-1 bg-white/[0.02]">
                      <span className="text-xs text-gray-300 uppercase tracking-wider">
                        Reallocated
                      </span>
                      <span className="font-medium text-xs text-emerald-300">
                        44 → Training
                      </span>
                    </div>
                    <div className="flex-1 border border-white/5 rounded-md p-2.5 flex flex-col gap-1 bg-white/[0.02]">
                      <span className="text-xs text-gray-300 uppercase tracking-wider">
                        Utilization
                      </span>
                      <span className="font-medium text-xs text-foreground font-mono">
                        98.2%
                      </span>
                    </div>
                    <div className="flex-1 border border-white/5 rounded-md p-2.5 flex flex-col gap-1 bg-white/[0.02]">
                      <span className="text-xs text-gray-300 uppercase tracking-wider">
                        Cluster
                      </span>
                      <span className="font-medium text-xs text-foreground font-mono">
                        512 GPUs
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fade overlay */}
            <div className="absolute inset-0 bg-gradient-to-tl from-black/50 to-transparent to-50% pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
