"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InferenceHeroGraphic } from "./InferenceHeroGraphic";

export function InferenceHero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="w-full max-w-[1280px] container mx-auto px-6 pt-24 pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Left - Text content */}
        <div
          className="flex flex-col gap-4 transition-all duration-700 ease-out"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(24px)",
          }}
        >
          <div className="w-fit flex px-2 py-0.5 rounded-lg bg-pink-400/10">
            <span className="text-pink-400 text-sm leading-[21px] whitespace-nowrap">
              Inference
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl tracking-tight text-foreground font-semibold">
            Serve models from the same cluster you train on.
          </h1>

          <p className="text-lg md:text-xl max-w-lg leading-relaxed text-muted-foreground">
            Konduktor handles training and inference on the same GPUs. Scale to
            zero when quiet, scale up when it counts. No new infrastructure, no
            new vendor, no idle GPUs sitting around.
          </p>

          <div className="flex items-center gap-2 pt-2">
            <Button className="w-fit">Book a demo</Button>
            <Button variant="link" className="w-fit">
              Read the docs
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>

        {/* Right - Graphic */}
        <div
          className="flex items-center justify-center transition-all duration-700 ease-out delay-200"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(24px)",
          }}
        >
          <InferenceHeroGraphic />
        </div>
      </div>
    </section>
  );
}
