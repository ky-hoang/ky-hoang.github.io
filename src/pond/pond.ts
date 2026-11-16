/*
  Runs the pond: sets up the canvas, listens for the mouse, and redraws
  about 60 times a second. Movement rules are in creatures.ts and the
  drawing is in draw.ts.

  The canvas is as tall as the whole page and scrolls with it, like the
  text does, so creatures live at page positions: they scroll out of view,
  and the part of the page you scroll to has its own. Only the part of the
  canvas near the screen is drawn each frame.

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
const POINTER_RESTS = 3_000; // ms without movement before they lose interest
const FADE_OUT = 0.35; // seconds, when switching between koi and fireflies
const FADE_IN = 0.5;
const MAX_CREATURES = 24;
const MAX_PIXELS = 12_000_000; // canvas memory cap; a very long page is drawn a little softer

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

  // Fewer creatures per screen on phones: about 5 on a phone, 9 on a laptop
  const small = window.innerWidth < 768;
  const perPixel = (small ? 7 : 10) / 1000;

  const world: World = {
    width: window.innerWidth,
    height: window.innerHeight,
    viewHeight: window.innerHeight,
    notice: 0,
    pointer: { x: 0, y: 0, active: false },
    treats: [],
  };

  const creatures: Creature[] = [];
  const ripples: Ripple[] = [];

  let kind = kindForTheme(); // which skin is showing
  let fade = 1; // 0 = invisible, 1 = fully shown
  let pointerMovedAt = 0;
  let lastFedAt = 0;

  // ---------- Page and canvas size ----------

  /**
   * The screen's size, used to decide how much of the page to draw. On
   * phones the browser's toolbar shrinks and grows while scrolling, which
   * changes this many times a second, so nothing expensive happens here.
   */
  function fitView(): void {
    world.viewHeight = window.innerHeight;
    world.notice = Math.min(world.width, world.viewHeight) / 3;
  }

  /**
   * Matches the canvas to the page: the CSS already stretches it over the
   * whole page, so this only sizes its pixel buffer and adds or removes
   * creatures. The page's height changes as images load and as the visitor
   * moves between pages; it does not change while scrolling.
   */
  function fitPage(): void {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === world.width && height === world.height && creatures.length > 0) return;

    const previousHeight = world.height;
    world.width = width;
    world.height = height;
    fitView();

    const sharpness = Math.min(
      window.devicePixelRatio || 1,
      2,
      Math.sqrt(MAX_PIXELS / (world.width * world.height)),
    );
    canvas.width = Math.round(world.width * sharpness);
    canvas.height = Math.round(world.height * sharpness);
    ctx!.setTransform(sharpness, 0, 0, sharpness, 0, 0);

    const wanted = Math.min(MAX_CREATURES, Math.round(world.height * perPixel));
    if (creatures.length === 0) {
      populate(wanted, 0, world.height);
    } else if (world.height > previousHeight) {
      populate(wanted - creatures.length, previousHeight, world.height);
    } else if (world.height < previousHeight) {
      // The page got shorter: let go of anything now below it, which cannot be seen
      for (let i = creatures.length - 1; i >= 0 && creatures.length > wanted; i--) {
        if (creatures[i].y > world.height) creatures.splice(i, 1);
      }
    }
    if (!running) draw(performance.now());
  }

  /** Spreads `count` new creatures over the part of the page between two heights */
  function populate(count: number, fromY: number, toY: number): void {
    for (let i = 0; i < count && creatures.length < MAX_CREATURES; i++) {
      creatures.push(createCreature(world.width, fromY, toY, small));
    }
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

  // The strip of the page drawn last frame, which must be wiped before the next one
  let drawnTop = 0;
  let drawnBottom = 0;

  function draw(now: number): void {
    // Draw the screen and a full screen beyond each edge, so nothing pops in
    // during a fast scroll. Holding still (reduced motion): draw the whole page.
    const reach = running ? world.viewHeight : Infinity;
    const top = Math.max(0, window.scrollY - reach);
    const bottom = Math.min(world.height, window.scrollY + world.viewHeight + reach);
    const inStrip = (y: number) => y > top && y < bottom;

    const clearTop = Math.min(top, drawnTop);
    const clearBottom = Math.max(bottom, drawnBottom);
    ctx!.clearRect(0, clearTop, world.width, clearBottom - clearTop);
    drawnTop = top;
    drawnBottom = bottom;

    // Glows add their light together where they overlap
    ctx!.globalCompositeOperation = kind === "firefly" ? "lighter" : "source-over";

    for (const ripple of ripples) {
      if (inStrip(ripple.y)) drawRipple(ctx!, ripple.x, ripple.y, (now - ripple.born) / RIPPLE_LASTS, kind, fade);
    }
    for (const treat of world.treats) {
      if (inStrip(treat.y)) drawTreat(ctx!, treat, kind, TREAT_BITES, now, fade);
    }
    for (const creature of creatures) {
      if (!inStrip(creature.y)) continue;
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

  const CONTROLS = "a, button, input, textarea, select, label, summary";
  const isControl = (target: EventTarget | null) => target instanceof Element && target.closest(CONTROLS) !== null;

  /** Drops a treat at a screen position; it is kept at that spot on the page */
  function feed(screenX: number, screenY: number, target: EventTarget | null): void {
    if (lessMotion.matches || fade < 1) return;
    // Leave links and buttons alone
    if (isControl(target)) return;

    const now = performance.now();
    if (now - lastFedAt < 400) return;
    lastFedAt = now;

    const x = screenX;
    const y = screenY + window.scrollY;
    world.treats.push({ x, y, born: now, life: TREAT_BITES });
    if (world.treats.length > MAX_TREATS) world.treats.shift();
    ripples.push({ x, y, born: now });
  }

  // A double-click normally highlights the word under the cursor. Stop that,
  // so feeding never selects text. Dragging to select still works as usual.
  window.addEventListener("mousedown", (event) => {
    if (event.detail > 1 && !lessMotion.matches && !isControl(event.target)) event.preventDefault();
  });

  window.addEventListener("dblclick", (event) => {
    feed(event.clientX, event.clientY, event.target);
  });

  // Phones do not send a reliable double-click, so watch for two quick taps
  let lastTap = { at: 0, x: 0, y: 0 };
  window.addEventListener("pointerup", (event) => {
    if (event.pointerType === "mouse") return;
    const now = performance.now();
    const near = Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 32;
    if (now - lastTap.at < 320 && near) {
      feed(event.clientX, event.clientY, event.target);
      lastTap.at = 0;
    } else {
      lastTap = { at: now, x: event.clientX, y: event.clientY };
    }
  });

  // ---------- Noticing the cursor ----------

  window.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    world.pointer.x = event.clientX;
    world.pointer.y = event.clientY + window.scrollY;
    world.pointer.active = true;
    pointerMovedAt = performance.now();
  });

  root.addEventListener("mouseleave", () => {
    world.pointer.active = false;
  });

  // ---------- Start ----------

  window.addEventListener("resize", fitView);
  document.addEventListener("visibilitychange", refresh);
  lessMotion.addEventListener("change", refresh);

  // The canvas stretches over the page, so it changes size exactly when the
  // page does. It is kept across page changes, so one observer is enough.
  new ResizeObserver(fitPage).observe(canvas);

  // The theme toggle changes data-theme on <html>; redraw the still picture if not animating
  new MutationObserver(() => {
    if (!running) refresh();
  }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  fitPage();
  refresh();
}
