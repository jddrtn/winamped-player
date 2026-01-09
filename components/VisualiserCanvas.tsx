"use client";

import React, { useEffect, useMemo, useRef } from "react";

type VisualiserCanvasProps = {
  /**pass real audio energy later; for now it can be undefined*/
  energy?: number;
  /**optional seed so visuals are stable per track later*/
  seed?: number;
};

export default function VisualiserCanvas({ energy, seed = 1 }: VisualiserCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // pseudo-random generator for stable bar heights
  const rand = useMemo(() => {
    let s = Math.max(1, seed | 0);
    return () => {
      // xorshift32
      s ^= s << 13;
      s ^= s >> 17;
      s ^= s << 5;
      return ((s >>> 0) % 1000) / 1000;
    };
  }, [seed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;

    // handle resize 
    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1)); // cap for perf
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in css 
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    // fake audio energy signal if not provided
    // smooth pulsing and a little noise
    let t0 = performance.now();
    let smoothEnergy = 0.2;

    // precompute base bar "DNA"
    const barCount = 64;
    const base = Array.from({ length: barCount }, () => 0.25 + rand() * 0.75);

    const draw = (now: number) => {
      if (!running) return;

      const dt = Math.min(50, now - t0);
      t0 = now;

      const w = container.clientWidth;
      const h = container.clientHeight;

      // background fade
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(0, 0, w, h);

      const time = now * 0.001;

      const synthetic =
        0.35 +
        0.25 * Math.sin(time * 2.2) +
        0.18 * Math.sin(time * 5.1) +
        0.08 * Math.sin(time * 11.0);

      const targetEnergy = typeof energy === "number" ? energy : Math.max(0, Math.min(1, synthetic));
      // smooth so it doesn't jitter
      smoothEnergy += (targetEnergy - smoothEnergy) * (1 - Math.pow(0.001, dt));

      // bars layout
      const paddingX = 18;
      const paddingY = 18;
      const usableW = Math.max(1, w - paddingX * 2);
      const usableH = Math.max(1, h - paddingY * 2);

      const gap = 3;
      const barW = Math.max(2, Math.floor((usableW - gap * (barCount - 1)) / barCount));

      // neon glow draw twice (blur-ish by alpha layering)
      const pink = (a: number) => `rgba(236,72,153,${a})`;

      for (let pass = 0; pass < 2; pass++) {
        const glow = pass === 0;
        for (let i = 0; i < barCount; i++) {
          const x = paddingX + i * (barW + gap);

          // create a moving wave across bars
          const wave = 0.55 + 0.45 * Math.sin(time * 2.0 + i * 0.22);
          const jitter = 0.88 + 0.12 * Math.sin(time * 8.0 + i * 1.7);

          // base bar profile and energy influence
          const height01 = Math.max(0, Math.min(1, base[i] * wave * jitter * (0.35 + smoothEnergy * 1.4)));
          const barH = Math.floor(height01 * usableH);

          const y = paddingY + (usableH - barH);

          if (glow) {
            ctx.fillStyle = pink(0.18);
            ctx.fillRect(x - 1, y - 1, barW + 2, barH + 2);
          } else {
            // main bar with subtle vertical gradient imitation via two fills
            ctx.fillStyle = pink(0.75);
            ctx.fillRect(x, y, barW, barH);

            ctx.fillStyle = pink(0.22);
            ctx.fillRect(x, y, barW, Math.max(2, Math.floor(barH * 0.25)));
          }
        }
      }

      // top-left glass highlight
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(0, 0, w, Math.max(40, Math.floor(h * 0.12)));

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [energy, rand]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
