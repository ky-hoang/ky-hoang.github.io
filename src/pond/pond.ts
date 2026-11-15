/*
  Runs the pond: sets up the canvas, listens for the mouse, and redraws
  about 60 times a second. Movement rules are in creatures.ts and the
  drawing is in draw.ts.

  Light mode shows koi, dark mode shows fireflies. Double-click (or
  double-tap) an empty spot to drop a treat.
*/

import { createCreature, mouthOf, stepCreature, type Creature, type Kind, type World } from "./creatures";
import { drawFirefly, drawKoi, drawRipple, drawTreat } from "./draw";

const TREAT_BITES = 5; // bites before a treat is gone
const TREAT_LASTS = 20_000; // ms before an uneaten treat disappears
const TREAT_SETTLES = 500; // ms before the first bite, so the school has time to turn
const BITE_GAP = 550; // ms between one creature's bites
const BITE_REACH = 16; // px
const MAX_TREATS = 5;
const RIPPLE_LASTS = 900; // ms
const POINTER_RESTS = 5_000; // ms without movement before they stop following
const FADE_OUT = 0.35; // seconds, when switching between koi and fireflies
const FADE_IN = 0.5;

interface Ripple {
  x: number;
  y: number;
  born: number;
}

export function startPond(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const root = document.documentElement;
  const lessMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const kindForTheme = (): Kind => (root.dataset.theme === "dark" ? "firefly" : "koi");

  const world: World = {
    width: window.innerWidth,
    height: window.innerHeight,
    pointer: { x: 0, y: 0, active: false },
    treats: [],
  };

  // Fewer creatures on phones
  const small = world.width < 768;
  const creatures: Creature[] = Array.from({ length: small ? 5 : 9 }, () =>
    createCreature(world.width, world.height, small),
  );
  const ripples: Ripple[] = [];

  let kind = kindForTheme(); // which skin is showing
  let fade = 1; // 0 = invisible, 1 = fully shown
  let pointerMovedAt = 0;
  let lastFedAt = 0;

  // ---------- Canvas size ----------

  function resize(): void {
    const sharpness = Math.min(window.devicePixelRatio || 1, 2);
    world.width = window.innerWidth;
    world.height = window.innerHeight;
    canvas.width = Math.round(world.width * sharpness);
    canvas.height = Math.round(world.height * sharpness);
    ctx!.setTransform(sharpness, 0, 0, sharpness, 0, 0);
    if (!running) draw(performance.now());
  }

  // ---------- One frame ----------

  function update(dt: number, now: number): void {
    // Theme changed: fade the old creatures out, swap, fade the new ones in
    if (kind !== kindForTheme()) {
      fade -= dt / FADE_OUT;
      if (fade <= 0) {
        fade = 0;
        kind = kindForTheme();
        world.treats.length = 0;
        ripples.length = 0;
      }
    } else if (fade < 1) {
      fade = Math.min(1, fade + dt / FADE_IN);
    }

    if (world.pointer.active && now - pointerMovedAt > POINTER_RESTS) {
      world.pointer.active = false;
    }

    for (const creature of creatures) stepCreature(creature, kind, world, dt);

    // Treats: expire the old ones, and let whoever is close enough take a bite
    for (let i = world.treats.length - 1; i >= 0; i--) {
      const treat = world.treats[i];
      if (now - treat.born > TREAT_LASTS) {
        world.treats.splice(i, 1);
        continue;
      }
      if (now - treat.born < TREAT_SETTLES) continue;

      for (const creature of creatures) {
        if (now - creature.nibbleAt < BITE_GAP) continue;
        const mouth = mouthOf(creature, kind);
        if (Math.hypot(treat.x - mouth.x, treat.y - mouth.y) > BITE_REACH) continue;

        creature.nibbleAt = now;
        treat.life -= 1;
        if (treat.life <= 0) {
          ripples.push({ x: treat.x, y: treat.y, born: now });
          world.treats.splice(i, 1);
        }
        break;
      }
    }

    for (let i = ripples.length - 1; i >= 0; i--) {
      if (now - ripples[i].born > RIPPLE_LASTS) ripples.splice(i, 1);
    }
  }

  function draw(now: number): void {
    ctx!.clearRect(0, 0, world.width, world.height);
    // Glows add their light together where they overlap
    ctx!.globalCompositeOperation = kind === "firefly" ? "lighter" : "source-over";

    for (const ripple of ripples) {
      drawRipple(ctx!, ripple.x, ripple.y, (now - ripple.born) / RIPPLE_LASTS, kind, fade);
    }
    for (const treat of world.treats) drawTreat(ctx!, treat, kind, TREAT_BITES, now, fade);
    for (const creature of creatures) {
      if (kind === "koi") drawKoi(ctx!, creature, fade);
      else drawFirefly(ctx!, creature, fade);
    }
    ctx!.globalAlpha = 1;
  }

  // ---------- The loop ----------

  let running = false;
  let frameId = 0;
  let lastFrameAt = 0;

  function frame(now: number): void {
    // Cap the step so a stalled tab does not make everything leap forward
    const dt = Math.min((now - lastFrameAt) / 1000, 0.05);
    lastFrameAt = now;
    update(dt, now);
    draw(now);
    frameId = requestAnimationFrame(frame);
  }

  /** Animates when it should; otherwise shows a single still picture */
  function refresh(): void {
    const shouldRun = !document.hidden && !lessMotion.matches;
    if (shouldRun && !running) {
      running = true;
      lastFrameAt = performance.now();
      frameId = requestAnimationFrame(frame);
    } else if (!shouldRun && running) {
      running = false;
      cancelAnimationFrame(frameId);
    }
    if (!shouldRun) {
      // Reduced motion: no animation, so switch skins at once and hold still
      kind = kindForTheme();
      fade = 1;
      world.treats.length = 0;
      ripples.length = 0;
      draw(performance.now());
    }
  }

  // ---------- Feeding ----------

  function feed(x: number, y: number, target: EventTarget | null, fromMouse: boolean): void {
    if (lessMotion.matches || fade < 1) return;
    // Leave links and buttons alone
    if (target instanceof Element && target.closest("a, button, input, textarea, select, label, summary")) return;
    // A double-click on a word selects it; that is not a request to feed
    if (fromMouse && window.getSelection()?.toString().trim()) return;

    const now = performance.now();
    if (now - lastFedAt < 400) return;
    lastFedAt = now;

    world.treats.push({ x, y, born: now, life: TREAT_BITES });
    if (world.treats.length > MAX_TREATS) world.treats.shift();
    ripples.push({ x, y, born: now });
  }

  window.addEventListener("dblclick", (event) => {
    feed(event.clientX, event.clientY, event.target, true);
  });

  // Phones do not send a reliable double-click, so watch for two quick taps
  let lastTap = { at: 0, x: 0, y: 0 };
  window.addEventListener("pointerup", (event) => {
    if (event.pointerType === "mouse") return;
    const now = performance.now();
    const near = Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 32;
    if (now - lastTap.at < 320 && near) {
      feed(event.clientX, event.clientY, event.target, false);
      lastTap.at = 0;
    } else {
      lastTap = { at: now, x: event.clientX, y: event.clientY };
    }
  });

  // ---------- Following the cursor ----------

  window.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    world.pointer.x = event.clientX;
    world.pointer.y = event.clientY;
    world.pointer.active = true;
    pointerMovedAt = performance.now();
  });

  root.addEventListener("mouseleave", () => {
    world.pointer.active = false;
  });

  // ---------- Start ----------

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", refresh);
  lessMotion.addEventListener("change", refresh);
  // The theme toggle changes data-theme on <html>; redraw the still picture if not animating
  new MutationObserver(() => {
    if (!running) refresh();
  }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  resize();
  refresh();
}
