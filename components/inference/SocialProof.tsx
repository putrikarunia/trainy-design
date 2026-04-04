export function SocialProof() {
  return (
    <div className="w-full py-20 px-6">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col items-center gap-8 py-8 border-t border-zinc-800">
          <div className="max-w-[560px] text-center">
            <p className="text-xl leading-[30px] text-zinc-500">
              From local to 64 H100s in under an hour –
              <span className="text-white">
                {" "}the fastest GPU setup we&apos;ve seen
              </span>
            </p>
          </div>
          <div className="w-[120px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://cdn.prod.website-files.com/674afcec6748393670f59db0/674e952cc90bed0ffe90900d_Linum%20AI.png"
              alt="Linum AI"
              className="w-[120px] inline-block max-w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
