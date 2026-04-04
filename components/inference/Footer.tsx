import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <div className="w-full flex items-center justify-center border-t border-zinc-700">
      <section className="w-full max-w-[1280px] container mx-auto py-12 pb-24 px-6">
        <div className="flex flex-col md:flex-row gap-16 justify-between">
          {/* Brand */}
          <div className="flex flex-col gap-4 min-w-[250px]">
            <div className="flex flex-col gap-3">
              <Link href="/">
                <Image src="/logo.svg" alt="Trainy" width={32} height={32} />
              </Link>
              <p className="text-white text-lg font-semibold m-0">Trainy</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-zinc-500 text-sm m-0 leading-relaxed">
                2261 Market Street #5039
              </p>
              <p className="text-zinc-500 text-sm m-0 leading-relaxed">
                San Francisco, CA 94114
              </p>
            </div>
          </div>

          {/* Product */}
          <div className="flex flex-col gap-4 min-w-[160px]">
            <p className="text-white text-sm font-semibold m-0">Product</p>
            <div className="flex flex-col gap-3">
              <Link
                href="/on-demand"
                className="text-sm text-muted-foreground hover:text-foreground transition-all no-underline"
              >
                On-Demand
              </Link>
              <Link
                href="/reserved"
                className="text-sm text-muted-foreground hover:text-foreground transition-all no-underline"
              >
                Reserved
              </Link>
              <Link
                href="/pricing"
                className="text-sm text-muted-foreground hover:text-foreground transition-all no-underline"
              >
                Pricing
              </Link>
              <Link
                href="/pluto"
                className="text-sm text-muted-foreground hover:text-foreground transition-all no-underline"
              >
                Experiment Tracking
              </Link>
            </div>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-4 min-w-[160px]">
            <p className="text-white text-sm font-semibold m-0">Resources</p>
            <div className="flex flex-col gap-3">
              <Link
                href="/blog"
                className="text-sm text-muted-foreground hover:text-foreground transition-all no-underline"
              >
                Blog
              </Link>
              <a
                href="https://docs.trainy.ai/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-all no-underline"
              >
                Documentation
              </a>
              <a
                href="mailto:sales@trainy.ai?subject=Contact"
                className="text-sm text-muted-foreground hover:text-foreground transition-all no-underline"
              >
                Contact
              </a>
              <a
                href="https://www.iubenda.com/privacy-policy/67976400"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-all no-underline"
              >
                Privacy Policy
              </a>
              <a
                href="https://www.iubenda.com/privacy-policy/67976400/cookie-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-all no-underline"
              >
                Cookie Policy
              </a>
              <a
                href="https://www.iubenda.com/terms-and-conditions/67976400"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-all no-underline"
              >
                Terms of service
              </a>
            </div>
          </div>

          {/* Social */}
          <div className="flex flex-col gap-4 min-w-[160px]">
            <p className="text-white text-sm font-semibold m-0">Social</p>
            <div className="flex flex-col gap-3">
              <a
                href="https://github.com/Trainy-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all no-underline"
              >
                <Image
                  src="/github.svg"
                  alt="Github"
                  width={16}
                  height={16}
                />
                Github
              </a>
              <a
                href="https://www.linkedin.com/company/trainy-ai/about/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all no-underline"
              >
                <Image
                  src="/linkedin.svg"
                  alt="LinkedIn"
                  width={16}
                  height={16}
                />
                LinkedIn
              </a>
              <a
                href="https://twitter.com/TrainyAI"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all no-underline"
              >
                <Image
                  src="/x.svg"
                  alt="Twitter"
                  width={16}
                  height={16}
                />
                Twitter / X
              </a>
              <a
                href="https://discord.gg/HQUBJSVgAP"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all no-underline"
              >
                <Image
                  src="/discord.svg"
                  alt="Discord"
                  width={16}
                  height={16}
                />
                Discord
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
