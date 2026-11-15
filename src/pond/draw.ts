/*
  How everything in the pond looks. Each creature is drawn with shapes in
  code, so there are no image files. Koi are seen from above, which lets
  them face any direction.

  Colors for the creatures live here rather than in tokens.css, because a
  canvas cannot read CSS variables cheaply on every frame.
*/

import type { Creature, Kind, Treat } from "./creatures";

const TAU = Math.PI * 2;

// ---------- Koi ----------

/** Body, patch and fin colors for each koi variety */
const KOI_LOOKS = [
  { body: "#f4f1ea", patch: "#e2572c", fin: "#f4f1ea" }, // white with red
  { body: "#e9783c", patch: null, fin: "#f0975f" }, // orange
  { body: "#e5ad3f", patch: null, fin: "#edc468" }, // gold
  { body: "#f4f1ea", patch: "#e9783c", fin: "#f4f1ea" }, // white with orange
  { body: "#e2572c", patch: "#f4f1ea", fin: "#ea7f5c" }, // red with white
] as const;

/** How see-through the koi are, so text above them stays readable */
const KOI_OPACITY = 0.55;

/** Points along the spine, nose to tail, and the body's half-width at each */
const SPINE = 9;
const PROFILE = [0.46, 0.8, 0.98, 1, 0.9, 0.74, 0.56, 0.38, 0.22];
const spineX = new Array<number>(SPINE).fill(0);
const spineY = new Array<number>(SPINE).fill(0);

/** Traces a smooth closed outline through a list of points */
function smoothOutline(path: Path2D, points: number[][]): void {
  const count = points.length;
  const last = points[count - 1];
  path.moveTo((last[0] + points[0][0]) / 2, (last[1] + points[0][1]) / 2);
  for (let i = 0; i < count; i++) {
    const point = points[i];
    const next = points[(i + 1) % count];
    path.quadraticCurveTo(point[0], point[1], (point[0] + next[0]) / 2, (point[1] + next[1]) / 2);
  }
  path.closePath();
}

export function drawKoi(ctx: CanvasRenderingContext2D, koi: Creature, fade: number): void {
  const length = koi.length;
  const half = length * 0.15;
  const look = KOI_LOOKS[Math.floor(koi.look * KOI_LOOKS.length) % KOI_LOOKS.length];
  const opacity = KOI_OPACITY * fade;

  // The spine bends in a wave that grows toward the tail. Drawn facing right;
  // the canvas is rotated below to point the koi where it is heading.
  for (let i = 0; i < SPINE; i++) {
    const t = i / (SPINE - 1);
    spineX[i] = length * (0.5 - t);
    spineY[i] = Math.sin(koi.swim - t * 3) * length * 0.075 * t * t;
  }

  const outline: number[][] = [[spineX[0] + half * 0.7, spineY[0]]];
  for (let i = 0; i < SPINE; i++) outline.push([spineX[i], spineY[i] - half * PROFILE[i]]);
  outline.push([spineX[SPINE - 1] - half * 0.25, spineY[SPINE - 1]]);
  for (let i = SPINE - 1; i >= 0; i--) outline.push([spineX[i], spineY[i] + half * PROFILE[i]]);
  const body = new Path2D();
  smoothOutline(body, outline);

  // Soft shadow on the pond floor, offset down and to the right
  ctx.save();
  ctx.translate(koi.x + length * 0.05, koi.y + length * 0.09);
  ctx.rotate(koi.angle);
  ctx.globalAlpha = 0.09 * fade;
  ctx.fillStyle = "#12302d";
  ctx.fill(body);
  ctx.restore();

  ctx.save();
  ctx.translate(koi.x, koi.y);
  ctx.rotate(koi.angle);

  // Side fins, a little behind the head, flapping gently
  const flap = Math.sin(koi.swim * 0.5) * 0.18;
  const finX = spineX[2] - length * 0.04;
  const finOut = half * PROFILE[2] + length * 0.03;
  ctx.globalAlpha = opacity * 0.6;
  ctx.fillStyle = look.fin;
  ctx.beginPath();
  ctx.ellipse(finX, spineY[2] - finOut, length * 0.1, length * 0.04, 0.7 + flap, 0, TAU);
  ctx.ellipse(finX, spineY[2] + finOut, length * 0.1, length * 0.04, -0.7 - flap, 0, TAU);
  ctx.fill();

  // Tail fin, swinging a beat behind the body
  const baseX = spineX[SPINE - 1];
  const baseY = spineY[SPINE - 1];
  const swing = Math.sin(koi.swim - 3.6) * length * 0.07;
  ctx.beginPath();
  ctx.moveTo(baseX + length * 0.04, baseY - half * 0.2);
  ctx.quadraticCurveTo(
    baseX - length * 0.08,
    baseY - length * 0.03 + swing * 0.3,
    baseX - length * 0.24,
    baseY + swing - length * 0.11,
  );
  ctx.quadraticCurveTo(
    baseX - length * 0.16,
    baseY + swing * 0.8 - length * 0.03,
    baseX - length * 0.13,
    baseY + swing * 0.7,
  );
  ctx.quadraticCurveTo(
    baseX - length * 0.16,
    baseY + swing * 0.8 + length * 0.03,
    baseX - length * 0.24,
    baseY + swing + length * 0.11,
  );
  ctx.quadraticCurveTo(
    baseX - length * 0.08,
    baseY + length * 0.03 + swing * 0.3,
    baseX + length * 0.04,
    baseY + half * 0.2,
  );
  ctx.closePath();
  ctx.fill();

  // Body
  ctx.globalAlpha = opacity;
  ctx.fillStyle = look.body;
  ctx.fill(body);

  // Colored patches along the back, for the varieties that have them
  if (look.patch) {
    ctx.fillStyle = look.patch;
    ctx.beginPath();
    const first = koi.look < 0.5 ? 1 : 2;
    for (const i of [first, first + 3]) {
      ctx.ellipse(spineX[i], spineY[i], length * 0.085, half * PROFILE[i] * 0.74, 0, 0, TAU);
    }
    ctx.fill();
  }

  // A faint edge, so the white koi show up against a light page
  ctx.globalAlpha = opacity * 0.4;
  ctx.strokeStyle = "#2c4744";
  ctx.lineWidth = 0.6;
  ctx.stroke(body);

  ctx.restore();
}

// ---------- Fireflies ----------

/** A soft round glow, painted once and then stamped for every firefly */
let glowStamp: HTMLCanvasElement | null = null;

function getGlowStamp(): HTMLCanvasElement {
  if (glowStamp) return glowStamp;
  const size = 96;
  glowStamp = document.createElement("canvas");
  glowStamp.width = size;
  glowStamp.height = size;
  const stampCtx = glowStamp.getContext("2d");
  if (stampCtx) {
    const gradient = stampCtx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255, 226, 150, 0.95)");
    gradient.addColorStop(0.22, "rgba(250, 196, 95, 0.42)");
    gradient.addColorStop(0.55, "rgba(240, 175, 70, 0.12)");
    gradient.addColorStop(1, "rgba(240, 175, 70, 0)");
    stampCtx.fillStyle = gradient;
    stampCtx.fillRect(0, 0, size, size);
  }
  return glowStamp;
}

function drawGlow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, opacity: number): void {
  ctx.globalAlpha = opacity;
  ctx.drawImage(getGlowStamp(), x - radius, y - radius, radius * 2, radius * 2);
}

export function drawFirefly(ctx: CanvasRenderingContext2D, firefly: Creature, fade: number): void {
  // Mostly dim, with a slow swell to full brightness
  const swell = 0.5 + 0.5 * Math.sin(firefly.blink);
  const brightness = 0.22 + 0.78 * swell * swell;

  drawGlow(ctx, firefly.x, firefly.y, firefly.glow * (0.8 + 0.5 * brightness), fade * brightness);

  ctx.globalAlpha = fade * (0.45 + 0.55 * brightness);
  ctx.fillStyle = "#fff6d6";
  ctx.beginPath();
  ctx.arc(firefly.x, firefly.y, 1.4, 0, TAU);
  ctx.fill();
}

// ---------- Treats and ripples ----------

/** A food pellet by day, a spark by night. It shrinks as it gets eaten. */
export function drawTreat(
  ctx: CanvasRenderingContext2D,
  treat: Treat,
  kind: Kind,
  fullLife: number,
  now: number,
  fade: number,
): void {
  const left = Math.max(0, treat.life) / fullLife;
  const popIn = Math.min(1, (now - treat.born) / 180);

  if (kind === "koi") {
    ctx.globalAlpha = 0.85 * fade;
    ctx.fillStyle = "#9a6238";
    ctx.beginPath();
    ctx.arc(treat.x, treat.y, (2 + 2.2 * left) * popIn, 0, TAU);
    ctx.fill();
    return;
  }

  const twinkle = 0.85 + 0.15 * Math.sin(now / 140);
  drawGlow(ctx, treat.x, treat.y, (12 + 16 * left) * popIn, fade * twinkle);
  ctx.globalAlpha = fade;
  ctx.fillStyle = "#fffbe8";
  ctx.beginPath();
  ctx.arc(treat.x, treat.y, 2.2 * popIn, 0, TAU);
  ctx.fill();
}

/** An expanding ring where a treat lands or is finished. `age` runs from 0 to 1. */
export function drawRipple(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  age: number,
  kind: Kind,
  fade: number,
): void {
  const spread = 1 - (1 - age) * (1 - age);
  ctx.globalAlpha = (1 - age) * 0.45 * fade;
  ctx.strokeStyle = kind === "koi" ? "#17756c" : "#f0b955";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, y, 6 + 44 * spread, 0, TAU);
  ctx.stroke();
}
