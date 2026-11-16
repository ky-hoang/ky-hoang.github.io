# Portfolio site

Live at [ky-hoang.github.io](https://ky-hoang.github.io).

A personal site built with [Astro](https://astro.build), plain CSS and TypeScript, with no other libraries. The home page opens with a photo, a short intro and links, then lists projects by year. Each project has its own page, and the background is a pond: koi in light mode, fireflies in dark mode.

## The one rule

**What the site says** lives in `src/content/` and `public/`. **How it looks** lives everywhere else. Day to day you only edit the first two.

## How to change things

| To do this | Do this |
|---|---|
| Add a project | Copy `templates/project/` into `src/content/projects/`, rename the folder, fill in `index.md`, and drop images into the same folder |
| Hide a project for now | Set `draft: true` in its `index.md`. It still shows in the local preview with a "Draft" label, but not on the live site |
| Remove a project | Delete its folder |
| Change the order | Nothing to do. Projects sort by `date`, newest first, grouped by year |
| Add, remove or edit a link | Edit one line in `src/content/site.ts`. Each link can name an `icon` |
| Add a new icon | Add an entry to the list in `src/components/Icon.astro` |
| Change your photo | Replace `src/content/profile.jpg` with a square photo. Delete the file to show no photo |
| Change your name or intro | `src/content/site.ts` |
| Edit the About page | `src/content/about.md` |
| Add or swap your résumé | Save it as `public/resume.pdf`, and set `resume: "/resume.pdf"` in `src/content/site.ts` |
| Change colors, fonts or widths | `src/styles/tokens.css` |
| Change the link preview picture | Replace `public/og.png` (1200 × 630 pixels). This is the card shown when the site's address is pasted into a chat or a post |
| Remove the pond | Delete `src/pond/`, the two Pond lines in `src/layouts/Base.astro`, and the hint in `src/components/Footer.astro` |

The folder name of a project becomes its address: `src/content/projects/my-project/` is served at `/projects/my-project/`.

### Project fields

The block at the top of each project's `index.md`:

| Field | Required | What it is |
|---|---|---|
| `title` | Yes | The project's name |
| `date` | Yes | `YYYY-MM-DD`. Sets the year group and the order |
| `type` | Yes | One of `personal`, `class`, `hackathon`, `club` |
| `summary` | Yes | One sentence, shown in the home page list |
| `stack` | No | Tools used, e.g. `[Python, pandas]` |
| `cover` | No | An image in the same folder, e.g. `./cover.png` |
| `links` | No | `code:` and/or `demo:`, each a full web address |
| `draft` | No | `true` hides it from the live site |

If a required field is missing, a field name is misspelled, or a value is not allowed, the build stops and names the file and the field. The live site stays on the last version that built.

## Preview on your Mac

```bash
npm run dev
```

Then open http://localhost:4321. The page updates as you save files. Press Ctrl+C in the terminal to stop.

To check that everything builds the way it will when published:

```bash
npm run build
```

## Publish

Commit your changes and push to the `main` branch. GitHub builds the site and puts it live in about a minute (`.github/workflows/deploy.yml` does this; the Actions tab on GitHub shows each run). Browsers may keep showing the old version for up to ten minutes; a hard refresh (Shift + reload) gets the new one.

## The pond

The background is one `<canvas>` behind the page, as tall as the page, that scrolls with it. Koi swim in light mode and fireflies drift in dark mode; double-click (or double-tap on a phone) an empty spot to drop food, or a spark at night. A single click touches the water, and anything close by darts away. Lily pads float at the sides, and once in a while one of the koi is a golden one that sparkles. The pond keeps going as you move between pages, holds still for visitors who have asked their device for reduced motion, and pauses when the tab is hidden.

| To change this | Look in |
|---|---|
| How many creatures, how long food lasts | The constants at the top of `src/pond/pond.ts` |
| How fast they swim, how far they wander, how often a golden koi appears | `TUNING` and `RARE_CHANCE` in `src/pond/creatures.ts` |
| How many lily pads, and where they sit | `src/pond/scenery.ts` |
| Koi colors and opacity, firefly glow, lily pad colors | `KOI_LOOKS`, the firefly section and `PAD_LOOKS` in `src/pond/draw.ts` |
| The hint in the footer | `src/components/Footer.astro` |

## Where things are

```
src/
├── content/              YOUR CONTENT
│   ├── site.ts           name, intro, links, résumé
│   ├── profile.jpg       your photo
│   ├── about.md          About page text
│   └── projects/         one folder per project
├── content.config.ts     the fields every project must have
├── pages/                one file per page (home, about, project, 404)
├── layouts/Base.astro    the frame every page shares: <head>, header, footer, pond
├── components/           header, footer, theme toggle, photo, links and icons, project list
├── lib/projects.ts       loads and sorts the projects
├── pond/                 the background
│   ├── Pond.astro        the canvas element and its placement
│   ├── pond.ts           runs the pond: sizing, the frame loop, feeding, the cursor
│   ├── creatures.ts      how creatures move
│   ├── scenery.ts        where the lily pads sit
│   └── draw.ts           how everything looks
└── styles/               tokens.css (colors, fonts, widths) and global.css
public/                   files served as they are: résumé, favicon, link preview picture
templates/project/        copy this to start a new project
.github/workflows/        publishes the site on every push
AGENTS.md                 notes for AI coding tools working in this repository
```

## Credits

Inspired by [yushan.li](https://yushan.li/), [trudy.computer](https://www.trudy.computer/) and [kyh.io](https://www.kyh.io/).
