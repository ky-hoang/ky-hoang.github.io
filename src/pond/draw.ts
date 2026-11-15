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

/**
 * Each variety: body color, patch color (or none), fin color, and the color
 * of the thin outline that keeps pale koi visible on a light page.
 */
const KOI_LOOKS = [
  { body: "#f5f2ea", patch: "#e0552b", fin: "#efe6d6", edge: "#9c8f7c" }, // kohaku: white with red
  { body: "#ec8040", patch: null, fin: "#f2a46e", edge: "#b45a26" }, // orange
  { body: "#e8b54a", patch: null, fin: "#f0cd7a", edge: "#a87d22" }, // gold
  { body: "#f5f2ea", patch: "#ec8040", fin: "#efe6d6", edge: "#9c8f7c" }, // white with orange
  { body: "#e0552b", patch: "#f5f2ea", fin: "#ec8a62", edge: "#a63a19" }, // red with white
] as const;

/** How see-through the koi are, so text above them stays readable */
const KOI_OPACITY = 0.62;

/** Points along the spine, nose to tail, and the body's half-width at each */
const SPINE = 9;
const PROFILE = [0.55, 0.86, 1, 0.98, 0.88, 0.72, 0.54, 0.38, 0.26];
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

/** A repeatable "random" number from 0 to 1, so each koi keeps its own pattern */
function seeded(seed: number, n: number): number {
  const x = Math.sin(seed * 9301 + n * 49297) * 233280;
  return x - Math.floor(x);
}

/** A soft fan-shaped fin pointing out from (x, y) at `angle` */
function fin(path: Path2D, x: number, y: number, angle: number, reach: number, width: number): void {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const tipX = x + cos * reach;
  const tipY = y + sin * reach;
  // Points either side of the tip, so the fin flares out like a fan
  const sideX = -sin * width;
  const sideY = cos * width;
  path.moveTo(x, y);
  path.quadraticCurveTo(tipX + sideX * 1.1, tipY + sideY * 1.1, tipX - cos * reach * 0.1, tipY - sin * reach * 0.1);
  path.quadraticCurveTo(tipX - sideX * 0.5, tipY - sideY * 0.5, x - cos * reach * 0.15, y - sin * reach * 0.15);
  path.closePath();
}

export function drawKoi(ctx: CanvasRenderingContext2D, koi: Creature, fade: number): void {
  const length = koi.length;
  const half = length * 0.14;
  const look = KOI_LOOKS[Math.floor(koi.look * KOI_LOOKS.length) % KOI_LOOKS.length];
  const opacity = KOI_OPACITY * fade;

  // The spine bends in a wave that grows toward the tail. Drawn facing right;
  // the canvas is rotated below to point the koi where it is heading.
  for (let i = 0; i < SPINE; i++) {
    const t = i / (SPINE - 1);
    spineX[i] = length * (0.42 - t * 0.78);
    spineY[i] = Math.sin(koi.swim - t * 3) * length * 0.07 * t * t;
  }

  const outline: number[][] = [[spineX[0] + half * 0.75, spineY[0]]];
  for (let i = 0; i < SPINE; i++) outline.push([spineX[i], spineY[i] - half * PROFILE[i]]);
  outline.push([spineX[SPINE - 1] - half * 0.2, spineY[SPINE - 1]]);
  for (let i = SPINE - 1; i >= 0; i--) outline.push([spineX[i], spineY[i] + half * PROFILE[i]]);
  const body = new Path2D();
  smoothOutline(body, outline);

  // Fins: two pectoral fins behind the head, two small pelvic fins midway,
  // and a long flowing tail, all moving with the swim
  const fins = new Path2D();
  const flap = Math.sin(koi.swim * 0.6) * 0.22;
  const pecX = spineX[2];
  const pecY = spineY[2];
  const pecOut = half * 0.85;
  fin(fins, pecX, pecY - pecOut, -2.2 - flap, length * 0.2, length * 0.07);
  fin(fins, pecX, pecY + pecOut, 2.2 + flap, length * 0.2, length * 0.07);
  const pelX = spineX[5];
  const pelY = spineY[5];
  const pelOut = half * PROFILE[5] * 0.8;
  fin(fins, pelX, pelY - pelOut, -2.5 + flap * 0.5, length * 0.11, length * 0.035);
  fin(fins, pelX, pelY + pelOut, 2.5 - flap * 0.5, length * 0.11, length * 0.035);

  const baseX = spineX[SPINE - 1];
  const baseY = spineY[SPINE - 1];
  const swing = Math.sin(koi.swim - 3.4) * length * 0.09;
  const tailLength = length * 0.3;
  fins.moveTo(baseX + length * 0.03, baseY - half * 0.22);
  fins.bezierCurveTo(
    baseX - tailLength * 0.3, baseY - half * 0.5 + swing * 0.3,
    baseX - tailLength * 0.8, baseY - length * 0.15 + swing,
    baseX - tailLength, baseY - length * 0.13 + swing * 1.1,
  );
  fins.quadraticCurveTo(baseX - tailLength * 0.55, baseY + swing * 0.8, baseX - tailLength, baseY + length * 0.13 + swing * 1.1);
  fins.bezierCurveTo(
    baseX - tailLength * 0.8, baseY + length * 0.15 + swing,
    baseX - tailLength * 0.3, baseY + half * 0.5 + swing * 0.3,
    baseX + length * 0.03, baseY + half * 0.22,
  );
  fins.closePath();

  // Soft shadow on the pond floor, offset down and to the right
  ctx.save();
  ctx.translate(koi.x + length * 0.05, koi.y + length * 0.09);
  ctx.rotate(koi.angle);
  ctx.globalAlpha = 0.08 * fade;
  ctx.fillStyle = "#12302d";
  ctx.fill(body);
  ctx.fill(fins);
  ctx.restore();

  ctx.save();
  ctx.translate(koi.x, koi.y);
  ctx.rotate(koi.angle);

  // Fins first, so the body sits on top. See-through, with a fine edge.
  ctx.globalAlpha = opacity * 0.7;
  ctx.fillStyle = look.fin;
  ctx.fill(fins);
  ctx.globalAlpha = opacity * 0.45;
  ctx.strokeStyle = look.edge;
  ctx.lineWidth = 0.6;
  ctx.stroke(fins);

  // Body
  ctx.globalAlpha = opacity;
  ctx.fillStyle = look.body;
  ctx.fill(body);

  // Patches: a few overlapping blobs, trimmed to the body so they wrap its
  // edges like real koi markings. Each koi has its own layout.
  if (look.patch) {
    ctx.save();
    ctx.clip(body);
    ctx.fillStyle = look.patch;
    ctx.beginPath();
    const seed = koi.look * 1000;
    const blobs = 3 + Math.floor(seeded(seed, 0) * 2);
    for (let n = 0; n < blobs; n++) {
      const i = 1 + Math.floor(seeded(seed, n + 1) * 6);
      const side = (seeded(seed, n + 11) - 0.5) * half * 1.4;
      const rx = length * (0.07 + seeded(seed, n + 21) * 0.07);
      const ry = half * (0.55 + seeded(seed, n + 31) * 0.5);
      ctx.ellipse(spineX[i], spineY[i] + side, rx, ry, seeded(seed, n + 41) - 0.5, 0, TAU);
    }
    ctx.fill();
    ctx.restore();
  }

  // Eyes, near the front of the head
  ctx.globalAlpha = opacity * 0.8;
  ctx.fillStyle = "#2a2622";
  ctx.beginPath();
  const eyeX = spineX[0] + half * 0.15;
  ctx.arc(eyeX, spineY[0] - half * 0.42, length * 0.014, 0, TAU);
  ctx.arc(eyeX, spineY[0] + half * 0.42, length * 0.014, 0, TAU);
  ctx.fill();

  // A fine outline, so the pale koi show up against a light page
  ctx.globalAlpha = opacity * 0.5;
  ctx.strokeStyle = look.edge;
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
