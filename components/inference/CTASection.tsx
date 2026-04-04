import Link from "next/link";

export function CTASection() {
  return (
    <div className="w-full flex items-center justify-center px-4 lg:px-[73.5px]">
      <div className="max-w-[1280px] w-full py-28">
        <div className="flex flex-col gap-8">
          <div className="h-px w-full bg-zinc-700" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center my-16">
            <div>
              <p className="text-2xl md:text-[32px] leading-[1.3]">
                Ready to scale your AI training?{" "}
                <span className="text-zinc-500">
                  Get enterprise-grade GPU infrastructure up and running in
                </span>{" "}
                <span className="text-amber-400">20 minutes.</span>
              </p>
            </div>

            <div className="flex gap-4 lg:justify-end">
              <Link
                href="/book-a-demo"
                className="block px-4 py-2 text-sm font-medium text-center whitespace-nowrap rounded-lg bg-white text-zinc-950 no-underline hover:bg-zinc-200 transition-colors"
              >
                Book a demo
              </Link>
              <Link
                href="mailto:support@trainy.ai?subject=Ask%20an%20Expert"
                className="block px-4 py-2 text-sm font-medium text-center whitespace-nowrap rounded-lg bg-zinc-800 text-foreground no-underline hover:bg-zinc-700 transition-colors"
              >
                Ask an Expert
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
