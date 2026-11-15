/*
  How the creatures move. The same rules drive both skins: koi by day and
  fireflies by night. Each one wanders on its own, drifts toward the cursor,
  and heads for the nearest treat when one is dropped.

  Nothing here draws anything; see draw.ts for that.
*/

export type Kind = "koi" | "firefly";

export interface Creature {
  x: number;
  y: number;
  /** Direction it is heading, in radians */
  angle: number;
  /** 0 to 1: how fast this one is compared with the others */
  pace: number;
  /** Koi body length in pixels */
  length: number;
  /** Firefly glow radius in pixels */
  glow: number;
  /** Position in the tail-beat cycle */
  swim: number;
  /** Position in the glow cycle */
  blink: number;
  blinkSpeed: number;
  /** Where it is wandering toward, and seconds until it picks a new heading */
  roamAngle: number;
  roamTimer: number;
  /** Its own spot beside a target, so the group spreads out instead of stacking */
  offsetX: number;
  offsetY: number;
  /** When it last took a bite, in milliseconds */
  nibbleAt: number;
  /** 0 to 1: picks its colors */
  look: number;
}

/** Food by day, a spark by night */
export interface Treat {
  x: number;
  y: number;
  born: number;
  life: number;
}

export interface World {
  width: number;
  height: number;
  pointer: { x: number; y: number; active: boolean };
  treats: Treat[];
}

/** Pixels per second, turning speed, and how restlessly each kind wanders */
const TUNING = {
  koi: { slow: 22, fast: 38, turn: 2.0, roamMin: 1.6, roamMax: 4.2, swing: 1.3, chase: 2.8 },
  firefly: { slow: 14, fast: 26, turn: 3.2, roamMin: 0.6, roamMax: 1.8, swing: 2.4, chase: 2.4 },
} as const;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export function createCreature(width: number, height: number, small: boolean): Creature {
  return {
    x: rand(0, width),
    y: rand(0, height),
    angle: rand(0, Math.PI * 2),
    pace: Math.random(),
    length: small ? rand(36, 54) : rand(44, 72),
    glow: small ? rand(10, 16) : rand(12, 20),
    swim: rand(0, Math.PI * 2),
    blink: rand(0, Math.PI * 2),
    blinkSpeed: rand(1.2, 2.6),
    roamAngle: rand(0, Math.PI * 2),
    roamTimer: rand(0, 3),
    offsetX: rand(-70, 70),
    offsetY: rand(-50, 50),
    nibbleAt: -Infinity,
    look: Math.random(),
  };
}

/** Turns from angle `from` toward `to` by fraction `amount`, the short way round */
function turnToward(from: number, to: number, amount: number): number {
  let difference = (to - from) % (Math.PI * 2);
  if (difference > Math.PI) difference -= Math.PI * 2;
  if (difference < -Math.PI) difference += Math.PI * 2;
  return from + difference * amount;
}

function nearestTreat(creature: Creature, treats: Treat[]): Treat | null {
  let nearest: Treat | null = null;
  let best = Infinity;
  for (const treat of treats) {
    const distance = Math.hypot(treat.x - creature.x, treat.y - creature.y);
    if (distance < best) {
      best = distance;
      nearest = treat;
    }
  }
  return nearest;
}

/** Moves one creature forward by `dt` seconds */
export function stepCreature(creature: Creature, kind: Kind, world: World, dt: number): void {
  const tuning = TUNING[kind];
  const cruise = tuning.slow + (tuning.fast - tuning.slow) * creature.pace;

  // Wander: every so often, pick a new heading near the current one
  creature.roamTimer -= dt;
  if (creature.roamTimer <= 0) {
    creature.roamTimer = rand(tuning.roamMin, tuning.roamMax);
    creature.roamAngle += rand(-tuning.swing, tuning.swing);
  }

  // Strayed past the edge of the screen: head back toward the middle
  const edge = 30;
  const outside =
    creature.x < -edge ||
    creature.x > world.width + edge ||
    creature.y < -edge ||
    creature.y > world.height + edge;
  if (outside && creature.roamTimer < 2) {
    creature.roamAngle = Math.atan2(
      world.height * rand(0.25, 0.75) - creature.y,
      world.width * rand(0.25, 0.75) - creature.x,
    );
    creature.roamTimer = 2.5;
  }

  let heading = creature.roamAngle;
  let speed = cruise;

  const treat = nearestTreat(creature, world.treats);
  if (treat) {
    // A treat is out: go straight for it, quickly, then slow down to nibble
    const distance = Math.hypot(treat.x - creature.x, treat.y - creature.y);
    heading = Math.atan2(treat.y - creature.y, treat.x - creature.x);
    speed = distance > creature.length * 0.8 ? cruise * tuning.chase : cruise * 0.4;
    creature.roamAngle = heading;
  } else if (world.pointer.active) {
    // No treat: lean toward the cursor, more strongly the farther away it is
    const targetX = world.pointer.x + creature.offsetX;
    const targetY = world.pointer.y + creature.offsetY;
    const distance = Math.hypot(targetX - creature.x, targetY - creature.y);
    const pull = Math.min(1, Math.max(0, (distance - 50) / 300)) * 0.7;
    const towardPointer = Math.atan2(targetY - creature.y, targetX - creature.x);
    heading = turnToward(creature.roamAngle, towardPointer, pull);
    speed = cruise * (1 + pull * 0.9);
  }

  // Turn smoothly rather than snapping, then move forward
  creature.angle = turnToward(creature.angle, heading, 1 - Math.exp(-tuning.turn * dt));
  creature.x += Math.cos(creature.angle) * speed * dt;
  creature.y += Math.sin(creature.angle) * speed * dt;

  // The tail beats faster when swimming faster
  creature.swim += (4 + (speed / cruise) * 3.5) * dt;
  creature.blink += creature.blinkSpeed * dt;
}

/** Where a creature takes its bite from: a koi's nose, a firefly's center */
export function mouthOf(creature: Creature, kind: Kind): { x: number; y: number } {
  if (kind === "firefly") return { x: creature.x, y: creature.y };
  return {
    x: creature.x + Math.cos(creature.angle) * creature.length * 0.5,
    y: creature.y + Math.sin(creature.angle) * creature.length * 0.5,
  };
}
