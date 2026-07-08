"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number; y: number;
  r: number; vy: number; vx: number;
  life: number; max: number; tw: number; warm: number;
}

export default function EmberCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const cv = ref.current;
    if (!cv || !cv.parentElement) return;

    const size = () => {
      cv.width = cv.parentElement!.clientWidth;
      cv.height = cv.parentElement!.clientHeight;
    };
    size();

    const ctx = cv.getContext("2d")!;
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);

    const count = Math.round(80 * Math.min(1.4, cv.width / 1400));
    const parts: Particle[] = [];

    const reset = (p: Particle, first: boolean): Particle => {
      p.x = rnd(0, cv.width);
      p.y = first ? rnd(0, cv.height) : cv.height + rnd(4, 40);
      p.r = rnd(0.6, 2.2);
      p.vy = -rnd(0.22, 1.0);
      p.vx = rnd(-0.14, 0.14);
      p.life = 0;
      p.max = rnd(280, 640);
      p.tw = rnd(0, Math.PI * 2);
      p.warm = Math.random();
      return p;
    };

    for (let i = 0; i < count; i++) {
      parts.push(reset({} as Particle, true));
    }

    let t = 0;
    let raf: number;

    const step = () => {
      t++;
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.globalCompositeOperation = "lighter";

      for (const p of parts) {
        p.x += p.vx + Math.sin(t / 42 + p.tw) * 0.12;
        p.y += p.vy;
        p.life++;
        const fade = Math.sin(Math.PI * Math.min(1, p.life / p.max));
        const flick = 0.55 + 0.45 * Math.sin(t / 5 + p.tw * 3);
        const a = fade * flick * 0.5;
        if (a > 0.005) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.2);
          const core = p.warm > 0.5 ? "255,176,32" : "251,80,17";
          g.addColorStop(0, `rgba(${core},${a.toFixed(3)})`);
          g.addColorStop(1, `rgba(${core},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
        if (p.y < -12 || p.life > p.max) reset(p, false);
      }

      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);

    const onResize = () => { size(); };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}
