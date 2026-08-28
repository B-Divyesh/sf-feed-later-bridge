# Feed Later Bridge — visual thesis

## Direction: luminous glass data landscape

Feed Later Bridge is infrastructure made visible: entries cross a standards-based bridge and settle into a calm, finite queue. The interface uses a midnight data landscape, translucent panes, and a single glowing route line. The glow communicates movement between systems; the broad dark field makes saved reading feel deliberate rather than attention-seeking. This is not a content feed aesthetic: there are no infinite rails, popularity counters, or algorithmic cards.

## Palette

The product is intentionally dark-first because the “night bridge” metaphor gives data transfer depth without a generic gradient hero. A light treatment is included for users who prefer it.

| Token | Dark | Light | Role |
|---|---:|---:|---|
| `--ink` | `#F5F7FF` | `#142235` | Primary text |
| `--muted` | `#B5BED2` | `#50627A` | Secondary text |
| `--ground` | `#07111D` | `#F2F7F8` | Page background |
| `--surface` | `#0F2030` | `#FFFFFF` | Solid fallback surface |
| `--glass` | `rgba(17, 38, 54, .74)` | `rgba(255,255,255,.80)` | Layered working surface |
| `--edge` | `#365064` | `#A9BAC7` | Boundaries |
| `--current` | `#5FE1D0` | `#087C73` | Bridge route / primary action |
| `--current-ink` | `#041B1B` | `#FFFFFF` | Text on primary action |
| `--signal` | `#FFCA69` | `#805400` | New/unread signal |
| `--success` | `#7FE09E` | `#17733A` | Completed/imported |
| `--danger` | `#FF8D8D` | `#B3272D` | Failure/destructive action |

Body copy and interactive states meet WCAG AA; status always has a label or icon in addition to color.

## Type

- **Display / labels:** `Arial Narrow`, `Aptos Narrow`, system sans-serif. Its condensed, instrument-panel character suits compact source metadata.
- **Reading / UI:** `Inter`, `Aptos`, `Segoe UI`, system sans-serif. We use the system stack, so no font download or third-party request is required.
- Scale: 12, 14, 16, 20, 28, 48–72px. Body is never below 16px on the site or queue content. Export/status microcopy may use 12–14px with AA contrast.
- Numeric counters use `font-variant-numeric: tabular-nums`.

## Layout and spacing

- 4px base rhythm; primary spacing steps are 8, 12, 16, 24, 32, 48, 72px.
- The site uses a 1180px max-width split hero. The application uses a 1120px workbench with a 280px source rail and a flexible queue.
- Glass panels are reserved for actual functional layers: source controls, queue, and item detail. Content is grouped by proximity before borders.
- On 390px screens the source rail becomes a top setup block, export actions wrap, and item metadata stacks. No controls disappear; secondary explanations shorten.
- Targets are at least 44×44px, including icon-only actions.

## Interaction grammar

- **Connect:** a solid teal action begins an import. While fetching, a route indicator moves once from source to queue.
- **Settle:** newly imported rows appear with a brief 8px rise and fade, then remain still.
- **Finish:** checking an item visibly moves it to Finished when that filter is active; the action can be undone from a timed toast.
- **Annotate:** notes expand immediately below their item, preserving spatial context rather than opening a detached modal.
- **Export:** formats are explicit buttons; completion is confirmed in a polite live region.
- Focus uses a 3px warm-signal ring so keyboard position is unambiguous against both themes.

## Motion policy

Transitions are 160–240ms and use only opacity and transform. There is no ambient looping animation. Route movement happens only during a user-triggered sync. With `prefers-reduced-motion: reduce`, all movement becomes an instant opacity/state change and smooth scrolling is disabled.

## Asset plan and art direction

The hero is an original wide raster illustration: a dark aerial landscape made of translucent stacked panes; a single cyan route arcs from a small feed beacon to an orderly amber/teal queue dock. Materials are smoked glass, fine mist, and subtle grain; lighting is blue-hour cyan with restrained warm signals; the lens is isometric/orthographic and wide. No people, device mockups, interface text, letters, logos, brand symbols, gradients used as empty decoration, or watermark.

Final prompt:

> Use case: stylized-concept. Asset type: wide landing-page hero illustration. Primary request: depict an abstract standards-based data bridge carrying a handful of luminous article tiles from one feed beacon to an orderly finite queue dock. Scene: nocturnal aerial data landscape, deep navy void, layered translucent smoked-glass planes, a single precise cyan route, small warm amber arrival lights. Style: premium editorial 3D illustration, tactile glass, subtle film grain, clean geometric forms. Composition: 3:2 landscape, bridge travels lower-left to upper-right, generous dark negative space around the edges, no cropped focal object. Lighting: blue-hour cyan edge light, restrained warm signals, calm and trustworthy. Palette: ink navy, tide teal, frost blue, signal amber. Constraints: no text, no letters, no people, no logos, no watermark, no branded UI, no phone or laptop, no infinite content stream, no neon cyberpunk clutter.

Generated through the factory Azure image generation deployment (`factory-image`) on 2026-08-28. The selected image and its prompt sidecar live in `assets/src/`; production WebP/AVIF derivatives live in `site/public/assets/`. Generated imagery is original for this product; project use is covered by the repository license. All interface icons and the bridge mark are hand-authored SVG/CSS geometry.

## Product character

Sentence-case, concise, and infrastructural: “Import feed”, “12 new, 3 already here”, “Nothing is trapped here.” The product does not call reading a streak, award points, or create urgency.
