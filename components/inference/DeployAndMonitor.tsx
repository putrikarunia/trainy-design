"use client";

import { Globe, Activity, Cpu, Clock } from "lucide-react";

export function DeployAndMonitor() {
  return (
    <div className="w-full flex items-center justify-center px-4 py-8 lg:py-16">
      <div className="max-w-[1280px] w-full flex flex-col gap-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 border-t border-b border-zinc-700">
          {/* Left - Deploy */}
          <div className="flex flex-col gap-12 py-16 pr-0 lg:pr-16 lg:border-r border-zinc-700">
            <div className="flex flex-col gap-4">
              <h3 className="text-xl leading-[30px] text-foreground">
                Deploy any model, zero code changes
              </h3>
              <p className="text-lg leading-[27px] text-zinc-500">
                Open source or your own custom fine-tuned model. Zero code
                changes required, same workflow as the rest of Konduktor.
              </p>
            </div>

            {/* Model Registry Card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tl from-black/50 to-transparent to-50% pointer-events-none z-10" />
              <div className="border border-white/10 rounded-xl shadow-2xl overflow-hidden bg-[#161618]">
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-700/50">
                  <div className="flex items-center gap-2.5">
                    <Cpu size={14} className="text-pink-400" />
                    <span className="text-zinc-100 text-[13px] font-medium">
                      Model Registry
                    </span>
                  </div>
                  <span className="text-zinc-500 text-[11px] font-mono">
                    3 deployed
                  </span>
                </div>
                <div className="flex flex-col gap-2 p-2">
                  {/* Llama */}
                  <div className="bg-gradient-to-tr from-black to-[#181820] border rounded-lg p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-500 bg-pink-800/15">
                        <span className="text-xs">🦙</span>
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-zinc-100 text-[13px] font-medium">
                          Llama 3.1 70B
                        </span>
                        <span className="text-zinc-500 text-[11px]">
                          Open source · vLLM
                        </span>
                      </div>
                      <span className="text-emerald-400 text-[11px] font-medium bg-emerald-400/10 rounded-lg px-2.5 py-0.5">
                        ● Live
                      </span>
                    </div>
                  </div>

                  {/* Custom */}
                  <div className="bg-gradient-to-tr from-black to-[#181820] border rounded-lg p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 min-w-7 min-h-7 flex items-center justify-center rounded-md border border-indigo-600 bg-indigo-500/15">
                        <Cpu size={14} className="text-indigo-300" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-zinc-100 text-[13px] font-medium">
                          Custom Fine-tuned 7B
                        </span>
                        <span className="text-zinc-500 text-[11px]">
                          Private · your-org/ft-model
                        </span>
                      </div>
                      <span className="text-emerald-400 text-[11px] font-medium bg-emerald-400/10 rounded-lg px-2.5 py-0.5">
                        ● Live
                      </span>
                    </div>
                  </div>

                  {/* Mistral */}
                  <div className="bg-gradient-to-tr from-black to-[#181820] border rounded-lg p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 flex items-center justify-center rounded-md border border-amber-600 bg-amber-600/15">
                        <svg
                          fill="none"
                          width="16"
                          xmlns="http://www.w3.org/2000/svg"
                          height="12"
                          viewBox="0 0 365 258"
                        >
                          <path
                            d="M104.107 0H52.0525V51.57H104.107V0Z"
                            fill="#FFD800"
                          />
                          <path
                            d="M312.351 0H260.296V51.57H312.351V0Z"
                            fill="#FFD800"
                          />
                          <path
                            d="M156.161 51.5701H52.0525V103.14H156.161V51.5701Z"
                            fill="#FFAF00"
                          />
                          <path
                            d="M312.353 51.5701H208.244V103.14H312.353V51.5701Z"
                            fill="#FFAF00"
                          />
                          <path
                            d="M312.356 103.14H52.0525V154.71H312.356V103.14Z"
                            fill="#FF8205"
                          />
                          <path
                            d="M104.107 154.71H52.0525V206.28H104.107V154.71Z"
                            fill="#FA500F"
                          />
                          <path
                            d="M208.228 154.711H156.174V206.281H208.228V154.711Z"
                            fill="#FA500F"
                          />
                          <path
                            d="M312.351 154.711H260.296V206.281H312.351V154.711Z"
                            fill="#FA500F"
                          />
                          <path
                            d="M156.195 206.312H0V257.882H156.195V206.312Z"
                            fill="#E10500"
                          />
                          <path
                            d="M364.439 206.312H208.244V257.882H364.439V206.312Z"
                            fill="#E10500"
                          />
                        </svg>
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-zinc-100 text-[13px] font-medium">
                          Mistral 8x7B MoE
                        </span>
                        <span className="text-zinc-500 text-[11px]">
                          Open source · TGI
                        </span>
                      </div>
                      <span className="text-amber-400 text-[11px] font-medium bg-amber-400/10 rounded-lg px-2.5 py-0.5">
                        Deploying
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Monitor */}
          <div className="flex flex-col gap-12 py-16 pl-0 lg:pl-16 border-t lg:border-t-0 border-zinc-700">
            <div className="flex flex-col gap-4">
              <h3 className="text-xl leading-[30px] text-foreground">
                Every endpoint monitored, out of the box
              </h3>
              <p className="text-lg leading-[27px] text-zinc-500">
                Public-facing endpoints are created automatically for every
                deployed model. Latency, throughput, and GPU utilization are
                tracked in real time. No extra setup, no third-party dashboards.
              </p>
            </div>

            {/* Endpoint Card */}
            <div className="flex flex-col items-center">
              {/* Top card */}
              <div className="w-full max-w-[400px] bg-gradient-to-tr from-black to-[#181820] border rounded-lg p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex px-2 py-0.5 rounded-lg bg-pink-500/20">
                      <span className="text-pink-400 text-xs">Inference</span>
                    </div>
                    <span className="text-zinc-600">›</span>
                    <span className="text-zinc-100 font-medium text-sm">
                      Llama 3.1 70B
                    </span>
                  </div>
                  <span className="text-emerald-400 text-[11px] font-medium bg-emerald-400/10 rounded-lg px-2.5 py-0.5">
                    ● Live
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Globe size={11} className="text-zinc-500" />
                    <span className="text-[11px] font-mono text-zinc-300">
                      llama-70b.trainy.ai/v1/completions
                    </span>
                  </div>
                  <div className="flex gap-3 mt-1">
                    <div className="flex items-center gap-1.5">
                      <Activity size={11} className="text-zinc-400" />
                      <span className="text-[11px] font-mono text-zinc-400">
                        1,284 req/s
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Cpu size={11} className="text-zinc-400" />
                      <span className="text-[11px] font-mono text-zinc-400">
                        8x H100
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={11} className="text-zinc-400" />
                      <span className="text-[11px] font-mono text-zinc-400">
                        42ms p99
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connector */}
              <div
                className="w-0.5 h-8 rotate-180"
                style={{
                  backgroundImage:
                    "linear-gradient(rgb(236,72,153), rgba(236,72,153,0.3) 60%, rgb(25,25,30))",
                }}
              />

              {/* Metrics card */}
              <div className="w-full max-w-[400px] bg-gradient-to-tr from-black to-[#181820] border rounded-lg p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-100 text-xs font-medium">
                    Endpoint Metrics
                  </span>
                  <span className="text-zinc-500 text-[11px] font-mono">
                    last 24h
                  </span>
                </div>
                <div className="flex gap-2 w-full">
                  <div className="flex-1 bg-gradient-to-tr from-[#101013] to-[#181820] border rounded-lg p-3">
                    <span className="text-foreground text-sm">1,284 req/s</span>
                    <span className="text-xs text-muted-foreground block">
                      Throughput
                    </span>
                  </div>
                  <div className="flex-1 bg-gradient-to-tr from-[#101013] to-[#181820] border rounded-lg p-3">
                    <span className="text-foreground text-sm">42ms</span>
                    <span className="text-xs text-muted-foreground block">
                      Latency
                    </span>
                  </div>
                  <div className="flex-1 bg-gradient-to-tr from-[#101013] to-[#181820] border rounded-lg p-3">
                    <span className="text-emerald-400 text-sm">99.98%</span>
                    <span className="text-xs text-muted-foreground block">
                      Uptime
                    </span>
                  </div>
                </div>

                {/* Sparkline chart */}
                <div
                  className="bg-gradient-to-tr from-[#101013] to-[#181820] border rounded-md overflow-hidden relative"
                  style={{
                    height: "80px",
                    background:
                      "linear-gradient(90deg, rgba(236,72,153,0.03) 0%, rgba(236,72,153,0.18) 100%)",
                  }}
                >
                  <svg
                    fill="none"
                    width="100%"
                    xmlns="http://www.w3.org/2000/svg"
                    height="80"
                    viewBox="0 0 376 80"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,60 L15,58 L30,55 L45,52 L60,48 L75,45 L90,42 L105,40 L120,38 L135,35 L150,30 L165,28 L180,30 L195,25 L210,22 L225,20 L240,18 L255,22 L270,18 L285,15 L300,12 L315,14 L330,10 L345,8 L360,12 L376,10 L376,80 L0,80 Z"
                      fill="rgba(244,114,182,0.12)"
                    />
                    <path
                      d="M0,60 L15,58 L30,55 L45,52 L60,48 L75,45 L90,42 L105,40 L120,38 L135,35 L150,30 L165,28 L180,30 L195,25 L210,22 L225,20 L240,18 L255,22 L270,18 L285,15 L300,12 L315,14 L330,10 L345,8 L360,12 L376,10"
                      fill="none"
                      stroke="rgba(244,114,182,0.8)"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
