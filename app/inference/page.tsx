import { Navbar } from "@/components/inference/Navbar";
import { InferenceHero } from "@/components/inference/InferenceHero";
import { SocialProof } from "@/components/inference/SocialProof";
import { ResourceAllocation } from "@/components/inference/ResourceAllocation";
import { AutoScaling } from "@/components/inference/AutoScaling";
import { DeployAndMonitor } from "@/components/inference/DeployAndMonitor";
import { ComparisonSection } from "@/components/inference/ComparisonSection";
import { CTASection } from "@/components/inference/CTASection";
import { Footer } from "@/components/inference/Footer";

export default function InferencePage() {
  return (
    <main className="bg-background">
      {/* Hero section with gradient background */}
      <div
        className="relative flex flex-col items-center w-full"
        style={{
          background:
            "linear-gradient(235deg, rgba(9,9,11,0.50) 56.01%, rgba(9,9,11,0.00) 60%), linear-gradient(50deg, #09090B 27.12%, rgba(9,9,11,0.00) 34.63%), linear-gradient(246deg, #09090B 46.44%, rgba(9,9,11,0.00) 61.13%), linear-gradient(320deg, #09090B 62.43%, #232328 91.55%)",
        }}
      >
        <Navbar />
        <InferenceHero />
      </div>

      {/* Social Proof */}
      <SocialProof />

      {/* Resource Allocation */}
      <ResourceAllocation />

      {/* Auto-scaling */}
      <AutoScaling />

      {/* Deploy & Monitor split */}
      <DeployAndMonitor />

      {/* Comparison */}
      <ComparisonSection />

      {/* CTA */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </main>
  );
}
