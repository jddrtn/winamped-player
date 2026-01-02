export default function WmpShell() {
  return (
    <div className="w-[820px] rounded-md overflow-hidden shadow-2xl border border-slate-700">
      {/* Title bar */}
      <div className="h-8 flex items-center justify-between px-2 bg-gradient-to-b from-blue-600 to-blue-800 text-white select-none">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-white/80" />
          <div className="text-sm font-semibold tracking-tight">
            Windows Media Player
          </div>
        </div>

        <div className="flex items-center gap-1">
          <WindowButton variant="min" />
          <WindowButton variant="max" />
          <WindowButton variant="close" />
        </div>
      </div>

      {/* Body */}
      <div className="bg-slate-200 p-3">
        {/* Video/Visualizer well */}
        <div className="bg-black rounded-sm border border-slate-500 shadow-inner">
          <div className="h-[420px] flex items-center justify-center text-slate-300/80 text-sm">
            Visualizer Area (Canvas goes here later)
          </div>
        </div>

        {/* Lower panel */}
        <div className="mt-3 rounded-md border border-slate-400 bg-gradient-to-b from-slate-100 to-slate-300 shadow-inner overflow-hidden">
          {/* Now playing strip */}
          <div className="flex items-center gap-3 p-3 bg-gradient-to-b from-blue-100 to-blue-200 border-b border-blue-300">
            <div className="w-14 h-14 rounded-sm border border-slate-400 bg-gradient-to-b from-white to-slate-300 shadow-inner" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-700">Now Playing</div>
              <div className="text-sm font-semibold text-slate-900 truncate">
                Track Title Placeholder
              </div>
              <div className="text-sm text-slate-800 truncate">
                Artist Placeholder
              </div>
            </div>

            <div className="text-xs text-slate-800 tabular-nums">
              00:00 / 00:00
            </div>
          </div>

          {/* Controls strip */}
          <div className="p-3 bg-gradient-to-b from-slate-50 to-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <ControlButton label="⏮" />
                <ControlButton label="▶" primary />
                <ControlButton label="⏹" />
                <ControlButton label="⏭" />
              </div>

              <div className="flex-1 flex items-center gap-2">
                <div className="text-xs text-slate-700 tabular-nums w-12 text-right">
                  00:00
                </div>
                <div className="flex-1">
                  <div className="h-3 rounded-full border border-slate-400 bg-white shadow-inner relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-[18%] bg-blue-500/70" />
                  </div>
                </div>
                <div className="text-xs text-slate-700 tabular-nums w-12">
                  00:00
                </div>
              </div>

              <div className="w-36 flex items-center gap-2">
                <div className="text-xs">🔊</div>
                <div className="flex-1">
                  <div className="h-3 rounded-full border border-slate-400 bg-white shadow-inner relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-[55%] bg-blue-500/60" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2 text-[11px] text-slate-700">
              Status: Ready
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type WindowButtonProps = {
  variant: "min" | "max" | "close";
};

function WindowButton({ variant }: WindowButtonProps) {
  const base =
    "w-6 h-5 rounded-sm border border-white/40 bg-gradient-to-b shadow-inner";

  if (variant === "close") {
    return (
      <button
        className={`${base} from-red-400 to-red-700`}
        aria-label="Close"
        type="button"
      />
    );
  }

  return (
    <button
      className={`${base} from-blue-200/70 to-blue-500/70`}
      aria-label={variant === "min" ? "Minimize" : "Maximize"}
      type="button"
    />
  );
}

type ControlButtonProps = {
  label: string;
  primary?: boolean;
};

function ControlButton({ label, primary }: ControlButtonProps) {
  return (
    <button
      type="button"
      className={[
        "w-10 h-8 rounded-md border shadow-inner select-none",
        primary
          ? "border-slate-500 bg-gradient-to-b from-blue-200 to-blue-400"
          : "border-slate-500 bg-gradient-to-b from-white to-slate-300",
      ].join(" ")}
      aria-label={label}
    >
      <span className="text-sm">{label}</span>
    </button>
  );
}
