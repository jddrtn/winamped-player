"use client";

import React, { useEffect, useRef } from "react";

type VisualiserCanvasProps = {
  /** Called each frame to read frequency bins (0..255). Return null if unavailable. */
  getFrequencyData: () => Uint8Array | null;
  /** Optional: waveform data for an oscilloscope overlay. */
  getTimeDomainData?: () => Uint8Array | null;
  /** Mirror bars from center outward (classic look). */
  mirror?: boolean;
};

export default function VisualiserCanvas({
  getFrequencyData,
  getTimeDomainData,
  mirror = true,
}: VisualiserCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Peak caps fall slowly like WMP
  const peaksRef = useRef<number[]>([]);
  const smoothRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let last = performance.now();

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const cssW = Math.max(1, Math.floor(rect.width));
      const cssH = Math.max(1, Math.floor(rect.height));
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Clear background
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, cssW, cssH);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    const pink = (a: number) => `rgba(236,72,153,${a})`;

    const draw = (now: number) => {
      if (!running) return;

      const dtMs = Math.min(50, now - last);
      last = now;
      const dt = dtMs / 16.6667; // ~frames at 60fps

      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));

      // Phosphor fade (trail)
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(0, 0, w, h);

      const freq = getFrequencyData();
      const time = getTimeDomainData?.() ?? null;

      // If no data yet, draw a subtle baseline glow
      if (!freq) {
        ctx.fillStyle = pink(0.12);
        ctx.fillRect(0, Math.floor(h * 0.6), w, 2);
        raf = requestAnimationFrame(draw);
        return;
      }

      // Choose how many bars to draw (WMP-like density)
      const bars = mirror ? 48 : 64;

      // Init smoothing arrays once
      if (smoothRef.current.length !== bars) {
        smoothRef.current = new Array(bars).fill(0);
        peaksRef.current = new Array(bars).fill(0);
      }

      const paddingX = 18;
      const paddingY = 16;
      const usableW = Math.max(1, w - paddingX * 2);
      const usableH = Math.max(1, h - paddingY * 2);

      // Map FFT bins -> bars (use midrange more than ultra-low/high)
      const binCount = freq.length;
      const startBin = Math.floor(binCount * 0.03);
      const endBin = Math.floor(binCount * 0.65);
      const span = Math.max(1, endBin - startBin);

      const gap = 3;
      const barW = Math.max(
        2,
        Math.floor((usableW - gap * (bars - 1)) / bars)
      );

      const capH = 3; // peak cap height
      const capGap = 2;

      // Smoothing / decay parameters (tweak to taste)
      const attack = 0.55; // rise speed
      const release = 0.14; // fall speed
      const peakFall = 0.35; // how quickly caps fall

      // Helper to sample freq in a range and average
      const sampleBar = (i: number) => {
        // perceptual-ish mapping: more resolution in lows
        const t = i / (bars - 1);
        const curved = t * t; // square bias toward low bins
        const center = startBin + Math.floor(curved * span);

        // average a small window of bins
        const win = 6;
        let sum = 0;
        let count = 0;
        for (let k = -Math.floor(win / 2); k <= Math.floor(win / 2); k++) {
          const idx = Math.min(endBin, Math.max(startBin, center + k));
          sum += freq[idx] ?? 0;
          count++;
        }
        return sum / Math.max(1, count); // 0..255-ish
      };

      // Draw bars + peak caps
      // Two-pass glow + core like WMP "neon"
      for (let pass = 0; pass < 2; pass++) {
        const glow = pass === 0;

        for (let i = 0; i < bars; i++) {
          const raw = sampleBar(i) / 255; // 0..1
          const prev = smoothRef.current[i];

          // Smooth: faster attack, slower release
          const next =
            raw > prev ? prev + (raw - prev) * attack : prev + (raw - prev) * release;

          // Store
          smoothRef.current[i] = next;

          // Convert to pixels
          const barH = Math.max(2, Math.floor(next * usableH));
          const y = paddingY + (usableH - barH);

          // Peak caps (hold the max and fall slowly)
          const peakPrev = peaksRef.current[i];
          const peakNext = Math.max(next, peakPrev - peakFall * 0.01 * dtMs);
          peaksRef.current[i] = peakNext;

          const peakY =
            paddingY + (usableH - Math.max(2, Math.floor(peakNext * usableH)));

          // X positioning (mirror if enabled)
          // If mirror: bars fill left->right but feel symmetric due to content;
          // optional: true center mirror is more complex; this reads WMP-ish already.
          const x = paddingX + i * (barW + gap);

          if (glow) {
            ctx.fillStyle = pink(0.16);
            ctx.fillRect(x - 1, y - 1, barW + 2, barH + 2);

            // cap glow
            ctx.fillRect(x - 1, peakY - 1, barW + 2, capH + 2);
          } else {
            // Main bar
            ctx.fillStyle = pink(0.78);
            ctx.fillRect(x, y, barW, barH);

            // Inner highlight strip (gives chrome feel)
            ctx.fillStyle = pink(0.22);
            ctx.fillRect(x, y, barW, Math.max(2, Math.floor(barH * 0.22)));

            // Peak cap
            ctx.fillStyle = pink(0.95);
            ctx.fillRect(x, peakY - capGap, barW, capH);
          }
        }
      }

      // Optional oscilloscope overlay (very WMP)
      if (time) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = pink(0.55);
        ctx.lineWidth = 1;

        const midY = Math.floor(paddingY + usableH * 0.55);
        const amp = Math.floor(usableH * 0.18);

        ctx.beginPath();
        for (let x = 0; x < usableW; x++) {
          const idx = Math.floor((x / usableW) * time.length);
          const v = (time[idx] ?? 128) - 128; // -128..127
          const y = midY + (v / 128) * amp;
          const px = paddingX + x;
          if (x === 0) ctx.moveTo(px, y);
          else ctx.lineTo(px, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Top glass highlight
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(0, 0, w, Math.max(36, Math.floor(h * 0.12)));

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [getFrequencyData, getTimeDomainData, mirror]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
