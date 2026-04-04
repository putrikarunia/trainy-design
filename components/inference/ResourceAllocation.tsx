"use client";

import { Loader2 } from "lucide-react";
import GpuPoolGrid from "./GpuPoolGrid";

export function ResourceAllocation() {
  return (
    <div className="w-full flex items-center justify-center px-4 py-16 lg:py-32">
      <div className="max-w-[1280px] w-full flex flex-col gap-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-12 items-center">
          {/* Left - Text */}
          <div className="flex flex-col gap-4">
            <div className="w-fit flex px-2 py-0.5 rounded-lg bg-pink-500/20">
              <span className="text-pink-400 text-sm leading-[21px]">
                Resource Allocation
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-medium text-foreground">
              One cluster. Training and inference, always balanced.
            </h2>
            <p className="text-lg leading-[27px] text-zinc-500">
              Training jobs and inference endpoints share the same GPU pool. The
              scheduler dynamically decides who gets what based on demand. When
              inference is low, those GPUs go back to training. When requests
              spike, it scales up. When there&apos;s zero traffic, it uses zero
              GPUs.
            </p>
          </div>

          {/* Right - Graphic */}
          <div className="relative flex flex-col items-center">
            {/* Top card - Training/Inference split */}
            <div className="w-full max-w-[500px] border border-white/10 rounded-xl shadow-2xl overflow-hidden p-2 flex flex-col gap-2 bg-[#161618]">
              <div className="flex flex-row gap-2 w-full">
                {/* Training */}
                <div className="flex-1 bg-gradient-to-tr from-black to-[#181820] border rounded-lg p-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-100 text-[13px]">Training</span>
                      <span className="text-emerald-400 px-2.5 py-0.5 text-[11px] bg-emerald-400/10 rounded-lg font-medium">
                        ● high
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground text-[13px]">
                      448 GPUs allocated
                    </span>
                  </div>
                </div>
                {/* Inference */}
                <div className="flex-1 bg-gradient-to-tr from-black to-[#181820] border rounded-lg p-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-100 text-[13px]">Inference</span>
                      <span className="text-pink-400 bg-pink-500/15 px-2.5 py-0.5 text-[11px] rounded-lg">
                        ↑ spiking
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground text-[13px]">
                      64 GPUs allocated
                    </span>
                  </div>
                </div>
              </div>
              {/* Rebalancing */}
              <div className="w-full bg-gradient-to-tr from-black to-[#181820] border rounded-lg p-3 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Loader2 className="text-emerald-300 animate-spin" size={16} />
                    <span className="text-zinc-100 text-[13px]">Rebalancing</span>
                  </div>
                  <span className="text-xs text-muted-foreground text-[13px]">
                    64 GPUs → Inference
                  </span>
                </div>
                <span className="text-xs text-muted-foreground text-[13px]">
                  2m 5s
                </span>
              </div>
            </div>

            {/* Connector */}
            <div className="w-0.5 h-10 bg-gradient-to-b from-zinc-700 to-amber-400" />

            {/* GPU Pool Grid */}
            <div className="w-full max-w-[500px] border border-white/10 rounded-xl shadow-2xl overflow-hidden p-2 bg-[#161618]">
              <GpuPoolGrid />
            </div>

            {/* Fade overlay */}
            <div className="absolute inset-0 bg-gradient-to-tl from-black/50 to-transparent to-50% pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
