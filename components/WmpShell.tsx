"use client";

import React, { useRef, useState } from "react";
import VisualiserCanvas from "@/components/VisualiserCanvas";
import MicVisualiser from "@/components/MicVisualiser";


export default function WmpShell() {
  const [activeControl, setActiveControl] = useState<
    "prev" | "play" | "stop" | "next" | null
  >(null);

  const [volume, setVolume] = useState(0.55); // 0..1
  const volumeTrackRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);

  function setVolumeFromClientX(clientX: number) {
    const el = volumeTrackRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const v = rect.width === 0 ? 0 : x / rect.width;
    setVolume(v);
  }

  function onVolumePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingVolume(true);
    setVolumeFromClientX(e.clientX);
  }

  function onVolumePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingVolume) return;
    setVolumeFromClientX(e.clientX);
  }

  function onVolumePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    setIsDraggingVolume(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-black via-zinc-950 to-black text-zinc-100">
      {/* Body */}
      <div className="h-full p-3">
        {/* Chrome frame */}
        <div className="h-full rounded-xl border border-pink-500/30 bg-gradient-to-b from-zinc-950 to-black shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_30px_80px_rgba(0,0,0,0.7)]">
          {/* Main split */}
          <div className="h-full grid grid-cols-1 md:grid-cols-[1fr_340px] gap-4 p-4">
            {/* LEFT: Visualiser + controls */}
            <div className="h-full flex flex-col">
              {/* Visualiser (single container, correct sizing) */}
              <div className="flex-1 relative rounded-xl border border-pink-500/40 bg-black shadow-inner shadow-pink-500/10 overflow-hidden">
                {/* glass highlight */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />

                {/* Canvas visualiser */}
                <MicVisualiser />


                {/* Overlay label */}
                <div className="pointer-events-none absolute bottom-3 left-3 text-[11px] text-zinc-400">
                  Visualiser: Bars (demo)
                </div>
              </div>

              {/* Controls */}
              <div className="mt-4 rounded-xl border border-pink-500/30 bg-gradient-to-b from-zinc-950 to-zinc-900 shadow-inner overflow-hidden">
                <div className="p-3">
                  <div className="flex items-center gap-3">
                    {/* Transport */}
                    <div className="flex items-center gap-2">
                      <ControlButton
                        label="⏮"
                        active={activeControl === "prev"}
                        onClick={() => setActiveControl("prev")}
                      />
                      <ControlButton
                        label="▶"
                        primary
                        active={activeControl === "play"}
                        onClick={() => setActiveControl("play")}
                      />
                      <ControlButton
                        label="⏹"
                        active={activeControl === "stop"}
                        onClick={() => setActiveControl("stop")}
                      />
                      <ControlButton
                        label="⏭"
                        active={activeControl === "next"}
                        onClick={() => setActiveControl("next")}
                      />
                    </div>

                    {/* Seek */}
                    <div className="flex-1 flex items-center gap-2">
                      <div className="text-xs tabular-nums w-12 text-right text-zinc-400">
                        00:00
                      </div>

                      <div className="flex-1">
                        <div className="h-3 rounded-full border border-white/10 bg-black/50 shadow-inner relative overflow-hidden">
                          <div className="absolute inset-y-0 left-0 w-[18%] bg-pink-500/70" />
                        </div>
                      </div>

                      <div className="text-xs tabular-nums w-12 text-zinc-400">
                        00:00
                      </div>
                    </div>

                    {/* Volume (interactive) */}
                    <div className="w-40 flex items-center gap-2">
                      <div className="text-xs text-zinc-400">🔊</div>

                      <div className="flex-1">
                        <div
                          ref={volumeTrackRef}
                          className="h-3 rounded-full border border-white/10 bg-black/50 shadow-inner relative overflow-hidden cursor-pointer touch-none"
                          onPointerDown={onVolumePointerDown}
                          onPointerMove={onVolumePointerMove}
                          onPointerUp={onVolumePointerUp}
                          onPointerCancel={onVolumePointerUp}
                          role="slider"
                          aria-label="Volume"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={Math.round(volume * 100)}
                          tabIndex={0}
                        >
                          <div
                            className="absolute inset-y-0 left-0 bg-pink-500/60"
                            style={{ width: `${volume * 100}%` }}
                          />
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-pink-300 shadow-[0_0_10px_rgba(236,72,153,0.5)]"
                            style={{ left: `calc(${volume * 100}% - 6px)` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-zinc-400">
                    Status: Ready
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Now Playing */}
            <aside className="h-full rounded-xl border border-pink-500/30 bg-gradient-to-b from-zinc-950 to-zinc-900 shadow-inner overflow-hidden">
              <div className="p-3 bg-gradient-to-b from-pink-500/20 to-transparent border-b border-pink-500/20">
                <div className="text-xs text-zinc-200">Now Playing</div>
              </div>

              <div className="p-3">
                <div className="flex items-start gap-3">
                  <div className="w-20 h-20 rounded-sm border border-white/10 bg-gradient-to-b from-zinc-800 to-zinc-950 shadow-inner" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-zinc-100 truncate">
                      Track Title Placeholder
                    </div>
                    <div className="text-sm text-zinc-300 truncate">
                      Artist Placeholder
                    </div>
                    <div className="mt-1 text-xs text-zinc-400 truncate">
                      Album Placeholder
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-xs tabular-nums text-zinc-300">
                  00:00 / 00:00
                </div>

                <div className="mt-4 rounded-md border border-white/10 bg-black/40 shadow-inner">
                  <div className="px-3 py-2 border-b border-white/10 text-xs font-semibold text-zinc-200">
                    Playlist
                  </div>
                  <div className="p-3 text-xs text-zinc-400">(Coming later)</div>
                </div>

                <div className="mt-3 rounded-md border border-white/10 bg-black/40 shadow-inner">
                  <div className="px-3 py-2 border-b border-white/10 text-xs font-semibold text-zinc-200">
                    Enhancements
                  </div>
                  <div className="p-3 text-xs text-zinc-400">(Coming later)</div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

type ControlButtonProps = {
  label: string;
  primary?: boolean;
  active?: boolean;
  onClick?: () => void;
};

function ControlButton({
  label,
  primary,
  active,
  onClick,
}: ControlButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={[
        "w-10 h-8 rounded-lg border select-none transition-all duration-150",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.10),inset_0_-10px_18px_rgba(0,0,0,0.7)]",
        active
          ? "border-pink-500 bg-gradient-to-b from-pink-400 to-pink-700 text-black shadow-[0_0_25px_rgba(236,72,153,0.6)]"
          : primary
          ? "border-pink-500/50 bg-gradient-to-b from-zinc-700 to-zinc-950 text-pink-200 shadow-[0_0_18px_rgba(236,72,153,0.25)]"
          : "border-white/10 bg-gradient-to-b from-zinc-800 to-zinc-950 text-zinc-200 hover:border-pink-500/40 hover:text-pink-200",
      ].join(" ")}
    >
      <span className="text-sm">{label}</span>
    </button>
  );
}
