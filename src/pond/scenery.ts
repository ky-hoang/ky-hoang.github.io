/*
  The things in the pond that stay put: lily pads.

  Pads sit in the empty space either side of the text. On a narrow screen
  there is no such space, so they peek in from the edges instead. Where
  each pad goes is worked out from its number, not from chance, so the pads
  stay where they are when the page grows as images load.
*/

export interface Pad {
  x: number;
  y: number;
  radius: number;
  /** Which way the notch in the leaf points, in radians */
  turn: number;
  /** Some pads carry a flower */
  flower: boolean;
  /** 0 to 1: sets this pad's own slow sway */
  sway: number;
}

const PAD_EVERY = 420; // px of page height per pad, roughly
const MAX_PADS = 12;
const TEXT_WIDTH = 688; // the text column and its gutters; see --column and --gutter in tokens.css

/** A repeatable "random" number from 0 to 1 for item `n` */
export function seeded(seed: number, n: number): number {
  const x = Math.sin(seed * 9301 + n * 49297) * 233280;
  return x - Math.floor(x);
}

/** The lily pads for a page of this size */
export function placePads(width: number, height: number): Pad[] {
  const count = Math.min(MAX_PADS, Math.round(height / PAD_EVERY));
  const margin = (width - TEXT_WIDTH) / 2; // empty space on each side of the text
  const roomy = margin > 110;
  const pads: Pad[] = [];

  for (let i = 0; i < count; i++) {
    const radius = roomy ? 26 + seeded(i, 1) * 26 : 22 + seeded(i, 1) * 14;
    const onLeft = i % 2 === 0;

    // How far in from the screen edge the pad's center sits
    const inset = roomy
      ? radius + seeded(i, 2) * Math.max(0, margin - radius * 2.2)
      : radius * (seeded(i, 2) * 0.5 - 0.15);

    pads.push({
      x: onLeft ? inset : width - inset,
      y: (i + 0.25 + seeded(i, 3) * 0.6) * (height / count),
      radius,
      turn: seeded(i, 4) * Math.PI * 2,
      flower: seeded(i, 5) < 0.5,
      sway: seeded(i, 6),
    });
  }
  return pads;
}
