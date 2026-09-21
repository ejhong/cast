# CAST — a stone-making atlas

A visual companion to [Aletheia’s Cast, Not Carved case](https://ejhong.github.io/aletheia/cases/megalithic-casting/). The front page connects the casting idea to specific construction problems. Five process studies illustrate rigid molds, yielding wall material, re-agglomerated limestone, fabric drainage, and a proposed quarry-treatment cycle.

These are **conceptual reconstructions**, not archaeological scans or validated physical simulations. A useful animation makes a mechanism understandable; it does not establish historical use. Each study includes competing explanations, sources, and a proposed physical test.

## Run

Requires Node 22 or later. No dependency installation is needed.

```sh
npm run build
npm run dev
```

Open http://127.0.0.1:4193/. The generated HTML, fonts, 3D library, and preview images are local and can be hosted directly on GitHub Pages. No runtime CDN, API, database, or build framework.

## Structure

```text
index.html                    Main narrative, study atlas, load calculator
tests/index.json              Study order
tests/<study>/
  study.json                  Narrative, process stages, assumptions, sources
  scene.js                    That study’s independent 3D scene
  index.html                  Generated, readable study page
shared/
  geometry.js                 Materials and geometry helpers
  stage.js                    Lighting, camera, rendering, input
  playback.js                 Play/pause, timeline, steps, visibility
  sources.mjs                 Public source registry
assets/previews/              Rendered scene illustrations and no-WebGL fallback
scripts/build.mjs             Small static page generator
checks/browser.mjs           Browser behavior and visual review
docs/                         Visual direction and new-study guidance
```

`tests/` contains the subject-matter studies the atlas explores; `checks/` contains software checks. Each study owns its content and scene. Shared controls and page templates keep new entries consistent.

## Add a study

1. Create `tests/<slug>/study.json` and `scene.js` using an existing study as a starting point.
2. Add its slug to `tests/index.json`, and any public references to `shared/sources.mjs`.
3. Export `build(scene, materials)` from the scene. Return `update(progress, options)`, `camera`, `target`, and `extent`. Progress is deterministic from 0 to 1.
4. Run `npm run build`, start the server, then `npm run previews`. Preview rendering needs local Chrome.
5. Run `npm run check` and `npm run test:browser`. Review the generated desktop and mobile screenshots.

See [the study guide](docs/ADDING-A-STUDY.md) and [the design direction](docs/DIRECTION.md).

## Checks and previews

```sh
npm run check
npm run test:browser
```

The browser check requires Google Chrome at its default macOS path, or `CAST_CHROME` pointing to a Chromium executable. It uses the running dev server at `CAST_SITE_URL` (default http://127.0.0.1:4193/). Screenshots go to a temporary directory unless `CAST_SCREENSHOTS` is set. To rebuild committed illustration PNGs, run `npm run previews` with the server running.

The browser checks exercise the timeline, stage selection, playback, options, keyboard camera controls, load arithmetic, mobile layout, reduced-motion default, and fallback without WebGL or scripts. They also check hosting below `/cast/`.

## Source and asset notes

The nearby `geo` and `aletheia-lab` repositories were consulted as research references. Their copyrighted books, confidential papers, and private notes are not included here. Primary public references are linked on each page. The original demonstrations are linked, not embedded or republished.

All scene geometry and procedural textures are original schematic illustrations. H-block and wall geometry are not measurement data. No chemical rates, curing times, or material strength are calculated. The load calculator only divides a hypothetical finished mass by the chosen load size.

Three.js 0.180.0 is vendored under its MIT license in `assets/vendor/`. Newsreader and IBM Plex Mono are distributed with their font licenses in `assets/fonts/`.
