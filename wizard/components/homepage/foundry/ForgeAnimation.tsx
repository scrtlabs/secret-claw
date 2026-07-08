"use client";

import { useEffect, useRef } from "react";

// Canvas dimensions of the original scene.
const W = 960, H = 640, S = 1.75, LW = 318, LH = 290;
const OX = (W - LW * S) / 2;
const OY = (H - LH * S) / 2 + 14;
const HITX = OX + 118 * S;
const HITY = OY + 166 * S;
const PERIOD = 2.4;
const IMPACT_AT = 1.55;

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function interp(ts: number[], vs: number[]) {
  return (t: number) => {
    if (t <= ts[0]) return vs[0];
    for (let i = 1; i < ts.length; i++) {
      if (t <= ts[i]) {
        const f = (t - ts[i - 1]) / (ts[i] - ts[i - 1]);
        return vs[i - 1] + (vs[i] - vs[i - 1]) * f;
      }
    }
    return vs[vs.length - 1];
  };
}

const angleAt = interp(
  [0, 0.4, 0.85, 1.05, 1.3, 1.45, 1.55, 1.64, 1.82, 2.02, 2.22, PERIOD],
  [0, 10, 36, 44, 48, 30, -3.5, 6, -1, 0.6, 0, 0]
);

function strikes(time: number, life: number) {
  const out: { seed: number; age: number }[] = [];
  const K = Math.floor((time - IMPACT_AT) / PERIOD);
  for (let k = K - 2; k <= K; k++) {
    const age = time - (IMPACT_AT + k * PERIOD);
    if (age > 0 && age < life) out.push({ seed: ((k % 3) + 3) % 3, age });
  }
  return out;
}

function lerp3(a: number[], b: number[], t: number) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function moltenColor(temp: number) {
  const c = temp > 0.5
    ? lerp3([255, 120, 25], [255, 242, 195], (temp - 0.5) * 2)
    : lerp3([115, 22, 10], [255, 120, 25], temp * 2);
  return `${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])}`;
}

interface Props {
  className?: string;
  style?: React.CSSProperties;
}

export default function ForgeAnimation({ className, style }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cv = ref.current;
    if (!cv) return;

    const fxA = document.createElement("canvas"); fxA.width = LW * S; fxA.height = LH * S;
    const fxH = document.createElement("canvas"); fxH.width = LW * S; fxH.height = LH * S;
    const xa = fxA.getContext("2d")!;
    const xh = fxH.getContext("2d")!;

    const loadImg = (src: string): Promise<HTMLImageElement> =>
      new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = src; });

    let raf: number;

    Promise.all([
      loadImg("/brand/forge-hammer.png"),
      loadImg("/brand/forge-anvil.png"),
    ]).then(([hammer, anvil]) => {
      const start = performance.now();
      const ctx = cv.getContext("2d")!;

      function frame(now: number) {
        const time = (now - start) / 1000;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const vw = cv.clientWidth, vh = cv.clientHeight;
        if (cv.width !== vw * dpr) { cv.width = vw * dpr; }
        if (cv.height !== vh * dpr) { cv.height = vh * dpr; }
        const fit = Math.min(vw / W, vh / H);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = "rgba(10,7,5,0)";
        ctx.clearRect(0, 0, vw, vh);
        ctx.setTransform(dpr * fit, 0, 0, dpr * fit, dpr * (vw - W * fit) / 2, dpr * (vh - H * fit) / 2);

        const phase = time % PERIOD;
        const angle = angleAt(phase) * Math.PI / 180;

        let heat = 0.12, lastAge = 99;
        const hs = strikes(time, 2.4);
        for (const s of hs) {
          heat += Math.exp(-s.age * 1.5) * 0.95;
          if (s.age < lastAge) lastAge = s.age;
        }
        heat = Math.min(1.4, heat);

        // backdrop (transparent — card bg shows through)
        const bg = ctx.createRadialGradient(W / 2, H * 0.62, 60, W / 2, H * 0.62, 620);
        bg.addColorStop(0, `rgba(58,32,16,${(0.5 + heat * 0.35) * 0.7})`);
        bg.addColorStop(0.55, "rgba(20,12,8,0)");
        bg.addColorStop(1, "rgba(10,7,5,0)");
        ctx.fillStyle = bg;
        ctx.fillRect(-40, -40, W + 80, H + 80);

        // screen shake
        let shX = 0, shY = 0;
        if (lastAge < 0.3) {
          const m = Math.exp(-lastAge * 12);
          shX = Math.sin(lastAge * 140) * 6 * m;
          shY = Math.cos(lastAge * 115) * 4.5 * m;
        }
        ctx.save();
        ctx.translate(shX, shY);

        // floor lava glow
        const fg = ctx.createRadialGradient(HITX, OY + 275 * S, 10, HITX, OY + 275 * S, 250);
        fg.addColorStop(0, `rgba(255,110,25,${0.55 * Math.min(1, 0.3 + heat * 0.55)})`);
        fg.addColorStop(0.5, `rgba(251,32,17,${0.25 * Math.min(1, 0.3 + heat * 0.55)})`);
        fg.addColorStop(1, "rgba(120,20,10,0)");
        ctx.fillStyle = fg;
        ctx.save();
        ctx.translate(HITX, OY + 272 * S); ctx.scale(1, 0.32); ctx.translate(-HITX, -(OY + 272 * S));
        ctx.fillRect(HITX - 260, OY + 272 * S - 250, 520, 500);
        ctx.restore();

        // anvil
        ctx.drawImage(anvil, OX, OY, LW * S, LH * S);

        // anvil fx
        xa.setTransform(1, 0, 0, 1, 0, 0);
        xa.clearRect(0, 0, fxA.width, fxA.height);
        xa.globalCompositeOperation = "source-over";
        const hg = xa.createRadialGradient(118 * S, 168 * S, 5, 118 * S, 168 * S, 170);
        hg.addColorStop(0, `rgba(255,200,90,${0.95 * Math.min(1, heat * 0.85)})`);
        hg.addColorStop(0.25, `rgba(255,110,25,${0.7 * Math.min(1, heat * 0.85)})`);
        hg.addColorStop(0.5, `rgba(251,32,17,${0.4 * Math.min(1, heat * 0.85)})`);
        hg.addColorStop(1, "rgba(120,20,10,0)");
        xa.fillStyle = hg; xa.fillRect(0, 0, fxA.width, fxA.height);
        const ms = strikes(time, 2.2);
        for (const s of ms) {
          const r = mulberry32(s.seed * 7919 + 401);
          for (let j = 0; j < 8; j++) {
            const d0 = 0.02 + r() * 0.14;
            const px = 118 + (r() * 2 - 0.7) * 62;
            const py = 168 + r() * 7;
            const sz = 5 + r() * 10;
            const a2 = s.age - d0;
            if (a2 <= 0) continue;
            const temp = Math.exp(-a2 * 1.4);
            const op = Math.min(1, a2 * 10) * Math.max(0, 1 - a2 / 2.1);
            xa.fillStyle = `rgba(${moltenColor(temp)},${op})`;
            xa.beginPath(); xa.ellipse(px * S, py * S, sz * (1 + a2 * 0.3) / 2, sz * 0.28, 0, 0, Math.PI * 2); xa.fill();
          }
          for (let j2 = 0; j2 < 2; j2++) {
            const dx = 100 + r() * 55;
            const a3 = s.age - 0.15; if (a3 <= 0) continue;
            const run = Math.min(52, a3 * 34);
            const t2 = Math.exp(-a3 * 1.1);
            const op2 = Math.min(1, a3 * 6) * Math.max(0, 1 - a3 / 2.1);
            const dg = xa.createLinearGradient(0, 172 * S, 0, 172 * S + run);
            dg.addColorStop(0, `rgba(${moltenColor(t2)},${op2 * 0.9})`);
            dg.addColorStop(1, `rgba(${moltenColor(t2 * 0.5)},0)`);
            xa.fillStyle = dg; xa.fillRect(dx * S, 172 * S, 3.5, run);
          }
        }
        xa.globalCompositeOperation = "destination-in"; xa.drawImage(anvil, 0, 0, fxA.width, fxA.height);
        ctx.drawImage(fxA, OX, OY);

        // hammer
        const pivX = OX + 0.935 * LW * S, pivY = OY + 0.48 * LH * S;
        ctx.save();
        ctx.translate(pivX, pivY); ctx.rotate(angle); ctx.translate(-pivX, -pivY);
        ctx.drawImage(hammer, OX, OY, LW * S, LH * S);
        const headGlow = lastAge < 1.2 ? Math.exp(-lastAge * 3.2) : 0;
        if (headGlow > 0.01) {
          xh.setTransform(1, 0, 0, 1, 0, 0); xh.clearRect(0, 0, fxH.width, fxH.height);
          xh.globalCompositeOperation = "source-over";
          const hgl = xh.createRadialGradient(120 * S, 105 * S, 5, 120 * S, 105 * S, 130);
          hgl.addColorStop(0, `rgba(255,180,60,${0.95 * headGlow})`);
          hgl.addColorStop(0.3, `rgba(251,60,17,${0.5 * headGlow})`);
          hgl.addColorStop(1, "rgba(120,20,10,0)");
          xh.fillStyle = hgl; xh.fillRect(0, 0, fxH.width, fxH.height);
          xh.globalCompositeOperation = "destination-in"; xh.drawImage(hammer, 0, 0, fxH.width, fxH.height);
          ctx.drawImage(fxH, OX, OY);
        }
        ctx.restore();

        // sparks
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        const ss = strikes(time, 0.8);
        for (const s of ss) {
          const r = mulberry32(s.seed * 5417 + 91);
          for (let n = 0; n < 28; n++) {
            const th = -Math.PI / 2 + (r() - 0.5) * 2.5;
            const sp = 240 + r() * 560;
            const vx = Math.cos(th) * sp;
            const vy = Math.sin(th) * sp * (0.75 + r() * 0.45);
            const g = 980;
            const x = HITX + vx * s.age;
            const y = HITY + vy * s.age + 0.5 * g * s.age * s.age;
            const cvy = vy + g * s.age;
            const mag = Math.sqrt(vx * vx + cvy * cvy);
            const tN = s.age / 0.8;
            const fade = Math.max(0, 1 - Math.pow(tN, 1.4));
            const len = Math.max(3, sp * 0.05 * (1 - tN * 0.55));
            const ux = vx / mag, uy = cvy / mag;
            const lg = ctx.createLinearGradient(x, y, x - ux * len, y - uy * len);
            lg.addColorStop(0, `rgba(${moltenColor(1 - tN * 0.85)},${fade})`);
            lg.addColorStop(1, "rgba(251,32,17,0)");
            ctx.strokeStyle = lg; ctx.lineWidth = 2.2; ctx.lineCap = "round";
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - ux * len, y - uy * len); ctx.stroke();
          }
        }

        // impact flash
        if (lastAge < 0.22) {
          const f = 1 - lastAge / 0.22;
          const fr = 150 * (0.45 + (1 - f) * 1.5);
          const flg = ctx.createRadialGradient(HITX, HITY, 2, HITX, HITY, fr);
          flg.addColorStop(0, `rgba(255,244,210,${f * 0.9})`);
          flg.addColorStop(0.35, `rgba(255,122,24,${f * 0.5})`);
          flg.addColorStop(1, "rgba(251,32,17,0)");
          ctx.fillStyle = flg; ctx.beginPath(); ctx.arc(HITX, HITY, fr, 0, Math.PI * 2); ctx.fill();
        }

        // drifting embers
        const cycles = [1.8, 2.4, 3.6];
        for (let i2 = 0; i2 < 16; i2++) {
          const r = mulberry32(i2 * 331 + 7);
          const cd = cycles[i2 % 3];
          const ph = r() * cd;
          const x0 = OX + 40 + r() * 470;
          const rise = 240 + r() * 140;
          const wf = 1.2 + r() * 1.6;
          const wa = 8 + r() * 16;
          const esz = 2 + r() * 2.5;
          const tt = ((time + ph) % cd) / cd;
          const ex = x0 + Math.sin((time + ph) * wf) * wa;
          const ey = OY + 185 * S - tt * rise;
          const eop = Math.max(0, Math.min(1, Math.sin(tt * Math.PI) * (0.3 + r() * 0.45) * (0.45 + heat * 0.5)));
          ctx.fillStyle = `rgba(255,176,32,${eop})`;
          ctx.beginPath(); ctx.arc(ex, ey, esz / 2 + 0.8, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore(); ctx.restore();

        if (!reduced) raf = requestAnimationFrame(frame);
      }

      raf = requestAnimationFrame(frame);
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={className}
      style={style}
    />
  );
}
