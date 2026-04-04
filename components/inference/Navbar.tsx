import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="sticky top-0 w-full max-w-[1280px] z-50">
      <div className="h-16 mx-auto flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <Image src="/logo.svg" alt="Trainy" width={32} height={32} />
          <span className="text-lg font-semibold text-foreground">Trainy</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-6">
            <Link
              href="/on-demand"
              className="text-sm text-muted-foreground hover:text-foreground transition-all no-underline"
            >
              Tracking
            </Link>
            <Link
              href="/inference"
              className="text-sm text-foreground transition-all no-underline"
            >
              Inference
            </Link>
            <Link
              href="/pluto"
              className="text-sm text-muted-foreground hover:text-foreground transition-all no-underline"
            >
              Experiment Tracking
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-all no-underline"
            >
              Pricing
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="secondary">
              Docs
            </Button>
            <Button size="sm">Book a demo</Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
