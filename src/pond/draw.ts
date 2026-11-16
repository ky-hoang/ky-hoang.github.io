/*
  How everything in the pond looks. Everything is drawn with shapes in
  code, so there are no image files. Koi and lily pads are seen from above,
  which lets the koi face any direction.

  Colors for the creatures live here rather than in tokens.css, because a
  canvas cannot read CSS variables cheaply on every frame.
*/

import type { Creature, Kind, Treat } from "./creatures";
import { seeded, type Pad } from "./scenery";

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

/** The rare golden koi. It is a little more solid than the rest, and sparkles. */
const RARE_LOOK = { body: "#f6c544", patch: "#fde9a8", fin: "#fbe3a0", edge: "#b98a12" } as const;
const SPARKLE_COLOR = "#eeb02a";

/** How see-through the koi are, so text above them stays readable */
const KOI_OPACITY = 0.62;
const RARE_OPACITY = 0.82;

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
  const look = koi.rare ? RARE_LOOK : KOI_LOOKS[Math.floor(koi.look * KOI_LOOKS.length) % KOI_LOOKS.length];
  const opacity = (koi.rare ? RARE_OPACITY : KOI_OPACITY) * fade;

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

  if (koi.rare) drawSparkles(ctx, koi, fade);
}

/** Three small stars that drift around the golden koi, twinkling in turn */
function drawSparkles(ctx: CanvasRenderingContext2D, koi: Creature, fade: number): void {
  ctx.fillStyle = SPARKLE_COLOR;
  for (let n = 0; n < 3; n++) {
    const twinkle = Math.max(0, Math.sin(koi.blink * 1.4 + n * 2.1));
    if (twinkle < 0.05) continue;

    const around = koi.blink * 0.3 + n * 2.1;
    const x = koi.x + Math.cos(around) * koi.length * (0.34 + n * 0.08);
    const y = koi.y + Math.sin(around) * koi.length * (0.34 + n * 0.08);
    const size = koi.length * 0.09 * twinkle;

    // A four-pointed star with sides that curve in toward the middle
    ctx.globalAlpha = 0.9 * twinkle * fade;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.quadraticCurveTo(x, y, x + size, y);
    ctx.quadraticCurveTo(x, y, x, y + size);
    ctx.quadraticCurveTo(x, y, x - size, y);
    ctx.quadraticCurveTo(x, y, x, y - size);
    ctx.fill();
  }
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

/**
 * An expanding ring where a treat lands, is finished, or the water is
 * touched. `age` runs from 0 to 1; `reach` is how far the ring spreads.
 */
export function drawRipple(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  reach: number,
  age: number,
  kind: Kind,
  fade: number,
): void {
  const spread = 1 - (1 - age) * (1 - age);
  ctx.globalAlpha = (1 - age) * 0.45 * fade;
  ctx.strokeStyle = kind === "koi" ? "#17756c" : "#f0b955";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, y, 6 + reach * spread, 0, TAU);
  ctx.stroke();
}

// ---------- Lily pads ----------

/** Green by day; by night, a dark shape the fireflies pass over */
const PAD_LOOKS = {
  koi: { leaf: "#8fbf9a", edge: "#5d9470", petal: "#f3b3c6", heart: "#f2c14e", opacity: 0.5 },
  firefly: { leaf: "#1a3531", edge: "#2c544d", petal: "#7d6a80", heart: "#b98f3c", opacity: 0.75 },
} as const;

const NOTCH = 0.3; // half the width of the gap in the leaf, in radians
const VEINS = 7;
const PETALS = 7;

/** A round leaf with a notch, a few veins, and sometimes a flower. It sways a little. */
export function drawLilyPad(ctx: CanvasRenderingContext2D, pad: Pad, kind: Kind, now: number, fade: number): void {
  const look = PAD_LOOKS[kind];
  const r = pad.radius;

  ctx.save();
  ctx.translate(pad.x, pad.y);
  ctx.rotate(pad.turn + Math.sin(now / 2600 + pad.sway * TAU) * 0.06);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, r, NOTCH, TAU - NOTCH);
  ctx.closePath();
  ctx.globalAlpha = look.opacity * fade;
  ctx.fillStyle = look.leaf;
  ctx.fill();
  ctx.globalAlpha = look.opacity * 0.7 * fade;
  ctx.strokeStyle = look.edge;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Veins fanning out from the middle, away from the notch
  ctx.globalAlpha = look.opacity * 0.35 * fade;
  ctx.beginPath();
  for (let n = 0; n < VEINS; n++) {
    const angle = NOTCH + ((n + 1) / (VEINS + 1)) * (TAU - NOTCH * 2);
    ctx.moveTo(Math.cos(angle) * r * 0.12, Math.sin(angle) * r * 0.12);
    ctx.lineTo(Math.cos(angle) * r * 0.82, Math.sin(angle) * r * 0.82);
  }
  ctx.stroke();

  if (pad.flower) {
    // Sits on the side of the leaf opposite the notch
    const flowerX = -r * 0.3;
    ctx.globalAlpha = Math.min(1, look.opacity * 1.5) * fade;
    ctx.fillStyle = look.petal;
    ctx.beginPath();
    for (let n = 0; n < PETALS; n++) {
      const angle = (n / PETALS) * TAU;
      const reach = r * 0.2;
      ctx.ellipse(flowerX + Math.cos(angle) * reach, Math.sin(angle) * reach, r * 0.2, r * 0.09, angle, 0, TAU);
    }
    ctx.fill();
    ctx.fillStyle = look.heart;
    ctx.beginPath();
    ctx.arc(flowerX, 0, r * 0.1, 0, TAU);
    ctx.fill();
  }

  ctx.restore();
}
