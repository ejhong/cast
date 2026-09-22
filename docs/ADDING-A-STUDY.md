# Adding a study

Keep one directory per subject-matter test in `tests/`. Register the slug in `tests/index.json`; the static generator creates its page and adds it to the atlas.

`study.json` owns the title, place, short summary, tags, five named steps, explanatory issues, model limitations, alternative account, proposed physical test, source IDs, and optional `geo` topic IDs. `control` describes a single boolean comparison in the scene. A source must be registered in `shared/sources.mjs`.

`scene.js` exports `build(scene, materials)`. It must return:

```js
{
  camera: [4, 3, 6],
  target: [0, 1, 0],
  extent: 4.8,
  update(progress, options) { /* deterministic scene state */ }
}
```

Progress must be reversible and deterministic: scrubbing backward must restore all visibility, geometry, material, and transform state. Do not rely on elapsed wall time. Put numeric assumptions in the study text; do not display manufactured measurements.

The current player divides the timeline into five equal stages. Keep stage actions aligned with 0–0.2, 0.2–0.4, 0.4–0.6, 0.6–0.8, and 0.8–1. `initial` chooses the most legible still frame. Playback starts at the beginning on the first play. The scene remains still until requested, including with reduced-motion preferences.

Distinguish three things in the copy:

1. The observed feature, using documentation of the particular artifact where available.
2. The proposed mechanism, attributed to its author and separated from our own reconstruction choices.
3. What would test the mechanism against the relevant conventional process.

For cloth and putty, geometry morphing is useful illustration; it is not a material simulation. For chemistry, use qualitative sequence labels until actual trial data support rates, temperatures, or strength. Add no private research sources or copyrighted book images to this public-ready repository.

Generate a poster with `npm run previews` after the build. This provides a durable card image and a readable fallback when WebGL or JavaScript is unavailable. Test at desktop and mobile widths, then review screenshots. Browser-rendered model illustrations should be labeled as reconstructions, never archival images.

Optional comparison fields:

- `control.offText`: prose appended when the study's checkbox is off. Set `checked` explicitly; it initializes both the checkbox and the scene option.
- `scenarios`: an array of `{id, label, description, steps?}`. The first scenario uses the base steps unless it supplies its own five stages. The chosen id arrives at the scene as `options.sequence`. Selecting a scenario preserves the timeline position; Play then restarts that sequence. All transform and visibility state must reset when switching scenarios.
- `caseStudy`: `{eyebrow, title, intro, metrics, paragraphs, source}`. Each metric has `{label, value, detail}` and `source` names a public reference. Use this to keep actual archaeological measurements distinct from an illustrative scene.
  `metrics` may be omitted for a photographic comparison. Optional `image` fields are `{src, width, height, alt, caption, credit, creditUrl, license, licenseUrl}`, with `src` relative to the site root. Credit and license appear below the image; keep a matching asset note in `assets/references/`. `linkLabel` can replace the default survey-link text.

Render only a new study's poster with `npm run previews -- --studies=your-slug`. The full browser checks cover all registered studies and every alternative scenario.
