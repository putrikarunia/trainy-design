export function ComparisonSection() {
  const rows = [
    {
      label: "Infrastructure",
      others: "Shared, vendor-managed",
      trainy: "Your cluster, your VPC",
    },
    {
      label: "Data Privacy",
      others: "Leaves your environment",
      trainy: "Never leaves your network",
    },
    {
      label: "Scaling",
      others: "Capped by provider limits",
      trainy: "1000s of GPUs, on demand",
    },
    {
      label: "Commitment",
      others: "Year-long contracts",
      trainy: "Pay only when training",
    },
    {
      label: "Vendor Lock-in",
      others: "Tied to their platform",
      trainy: "Cloud-agnostic, portable",
    },
  ];

  return (
    <div className="w-full flex items-center justify-center px-4 lg:px-[73.5px]">
      <div className="max-w-[1280px] w-full py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left - Text */}
          <div className="flex flex-col gap-4">
            <div className="w-fit flex px-2 py-0.5 rounded-lg bg-emerald-950">
              <span className="text-emerald-400 text-sm leading-[21px]">
                Comparison
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold text-foreground leading-tight">
              Your cluster. Not ours.
            </h2>
            <p className="text-lg leading-[27px] text-zinc-500">
              Other platforms are great tools, but you&apos;re renting their
              infrastructure. With Trainy, inference runs in your own cluster,
              your own VPC, your own cloud account. Your data doesn&apos;t leave
              your environment. No extra vendor in the chain.
            </p>
          </div>

          {/* Right - Comparison Table */}
          <div className="bg-gradient-to-tr from-black to-[#181820] border rounded-lg p-5 shadow-2xl shadow-black/25">
            <div className="flex flex-col gap-4">
              {/* Header */}
              <div className="grid grid-cols-3 gap-6" style={{ gridTemplateColumns: "180px 180px 180px" }}>
                <div />
                <span className="text-zinc-500">Others</span>
                <span className="text-foreground">Trainy</span>
              </div>

              <div className="h-px bg-zinc-700 mt-2 mb-4" />

              {/* Rows */}
              <div className="flex flex-col gap-9">
                {rows.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-3 gap-6"
                    style={{ gridTemplateColumns: "180px 180px 180px" }}
                  >
                    <span className="font-medium text-foreground">
                      {row.label}
                    </span>
                    <span className="text-zinc-500">{row.others}</span>
                    <span className="text-emerald-300">{row.trainy}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
