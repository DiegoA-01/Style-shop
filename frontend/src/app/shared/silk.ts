// La seda de Style Shop: 56 hilos que pasan de colgar (p=0), a caer (p≈0.5),
// a quedar doblados en capas sobre un pedestal (p=1). Función pura de dibujo:
// quien la usa decide cuándo llamarla (scroll en el home, fija en login).
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const smoothstep = (p: number, e0: number, e1: number) => {
  const t = clamp((p - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const N = 56, M = 48;

export function drawSilk(ctx: CanvasRenderingContext2D, W: number, H: number, p: number, time: number): void {
    ctx.clearRect(0, 0, W, H);

    const cx = W * 0.5;
    const ribbonW = Math.max(110, W * 0.15);
    const floorY = H * 0.8;
    const folds = 5;
    const layerH = Math.max(12, H * 0.03);
    const foldW = Math.max(200, W * 0.26);

    // Pedestal de piedra que aparece mientras la seda llega.
    const ped = smoothstep(p, 0.5, 0.9);
    if (ped > 0) {
      const pw = foldW * 1.25, ph = H * 0.14;
      const g = ctx.createLinearGradient(0, floorY, 0, floorY + ph);
      g.addColorStop(0, `rgba(58,61,70,${0.9 * ped})`);
      g.addColorStop(1, `rgba(22,24,29,${0.9 * ped})`);
      ctx.fillStyle = g;
      ctx.fillRect(cx - pw / 2, floorY + layerH * 0.6, pw, ph);
      ctx.fillStyle = `rgba(196,196,200,${0.35 * ped})`;
      ctx.fillRect(cx - pw / 2, floorY + layerH * 0.6, pw, 1);
    }

    const q1 = smoothstep(p, 0, 0.5);           // colgar -> caer
    const q2 = clamp((p - 0.45) / 0.55, 0, 1);  // caer -> doblar
    const breath = time * 0.0006;

    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 1.1;

    const xs = new Float32Array(M), ys = new Float32Array(M);
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      for (let j = 0; j < M; j++) {
        const s = j / (M - 1);

        // A: cuelga desde arriba
        const tip = 1 - 0.85 * smoothstep(s, 0.78, 1);
        const ax = cx + (u - 0.5) * ribbonW * (1 - 0.25 * s) * tip + Math.sin(s * 2.6 * Math.PI + 0.8) * W * 0.045 * s;
        const ay = -0.08 * H + s * 0.62 * H;
        // B: cae larga, casi tocando el piso
        const bx = cx + (u - 0.5) * ribbonW * (0.85 + 0.45 * s) * tip + Math.sin(s * 3 * Math.PI - 0.6) * W * 0.07 * (0.3 + s);
        const by = -0.1 * H + s * (floorY + 0.1 * H);
        // C: doblada en capas sobre el pedestal (el extremo de abajo se dobla primero)
        const seg = (1 - s) * folds;
        const k = Math.min(folds - 1, Math.floor(seg));
        const f = seg - k;
        const dir = k % 2 === 0 ? 1 : -1;
        const cxF = cx + dir * foldW * 0.5 * -Math.cos(f * Math.PI);
        const cyF = floorY - (k + smoothstep(f, 0.82, 1)) * layerH + (u - 0.5) * layerH * 0.85;

        const x1 = lerp(ax, bx, q1), y1 = lerp(ay, by, q1);
        const local = smoothstep(q2 - (1 - s) * 0.35, 0, 0.65);
        const alive = (1 - local * 0.85) * 4;
        xs[j] = lerp(x1, cxF, local) + Math.sin(breath + s * 6 + u * 2.2) * alive;
        ys[j] = lerp(y1, cyF, local) + Math.cos(breath * 0.8 + s * 4 + u) * alive * 0.5;
      }

      const sheen = 0.18 + 0.5 * Math.pow(Math.sin(u * Math.PI * 3 + breath * 0.6), 2);
      ctx.strokeStyle = i % 9 === 4
        ? `rgba(229,56,59,${0.32 * sheen + 0.08})`
        : `rgba(196,196,200,${0.22 * sheen + 0.05})`;
      ctx.beginPath();
      ctx.moveTo(xs[0], ys[0]);
      for (let j = 1; j < M - 1; j++) {
        ctx.quadraticCurveTo(xs[j], ys[j], (xs[j] + xs[j + 1]) / 2, (ys[j] + ys[j + 1]) / 2);
      }
      ctx.lineTo(xs[M - 1], ys[M - 1]);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
}
