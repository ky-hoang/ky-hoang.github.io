# Portfolio site

A personal site built with [Astro](https://astro.build). The home page lists projects by year, each project has its own page, and the background is a pond: koi in light mode, fireflies in dark mode.

## The one rule

**What the site says** lives in `src/content/` and `public/`. **How it looks** lives everywhere else. Day to day you only edit the first two.

## How to change things

| To do this | Do this |
|---|---|
| Add a project | Copy `templates/project/` into `src/content/projects/`, rename the folder, fill in `index.md`, and drop images into the same folder |
| Hide a project for now | Set `draft: true` in its `index.md`. It still shows in the local preview with a "Draft" label, but not on the live site |
| Remove a project | Delete its folder |
| Change the order | Nothing to do. Projects sort by `date`, newest first, grouped by year |
| Add, remove or edit a link | Edit one line in `src/content/site.ts` |
| Change your name or intro | `src/content/site.ts` |
| Edit the About page | `src/content/about.md` |
| Add or swap your résumé | Save it as `public/resume.pdf`, and set `resume: "/resume.pdf"` in `src/content/site.ts` |
| Change colors, fonts or widths | `src/styles/tokens.css` |
| Remove the pond | Delete `src/pond/` and the two Pond lines in `src/layouts/Base.astro` |

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

Once the GitHub repository is set up, publishing is: commit your changes and push to the `main` branch. GitHub builds the site and puts it live in about a minute (`.github/workflows/deploy.yml` does this).

## Where things are

```
src/
├── content/            YOUR CONTENT
│   ├── site.ts         name, intro, links, résumé
│   ├── about.md        About page text
│   └── projects/       one folder per project
├── content.config.ts   the fields every project must have
├── pages/              one file per page (home, about, project, 404)
├── layouts/Base.astro  the frame every page shares
├── components/         header, footer, theme toggle, project list
├── lib/projects.ts     loads and sorts the projects
├── pond/               the koi and firefly background
└── styles/             tokens.css (colors, fonts) and global.css
public/                 files served as they are: résumé, favicon
templates/project/      copy this to start a new project
```

## Credits

Inspired by [yushan.li](https://yushan.li/), [trudy.computer](https://www.trudy.computer/) and [kyh.io](https://www.kyh.io/).
