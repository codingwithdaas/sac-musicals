# SacMusicals: design notes

## Direction

The site leads with white and gold, with espresso brown kept as an accent, and it should feel calm and handmade. The home page opens on a real-time tabla pair. Scrolling flies the camera down into the dayan's syahi until the black fills the screen, and then the brand statement opens from the centre.

## Colour

| Token | Hex | Use |
| --- | --- | --- |
| `--white` | #ffffff | Main background |
| `--ivory` | #fbf7ef | Tinted sections |
| `--sand` | #f3eadb | Image placeholders |
| `--line` | #eadfcb | Borders |
| `--gold` | #c08a43 | Rules, icons, buttons |
| `--gold-deep` | #a87132 | Italic gold in headings (3:1 or better on white, ivory and sand) |
| `--gold-ink` | #8a5c22 | Small gold text (4.5:1 or better on white) |
| `--espresso` | #2b1a10 | Body text, dark bands |
| `--muted` | #6e5a48 | Secondary text |
| `--syahi` | #141214 | The dive's black |

## Type

- **Bodoni Moda** for display, with italics in gold for the "voice" phrase in each heading.
- **Hanken Grotesk** for body and UI text.

Both are self-hosted.

## Motion

- Lenis gives the smooth scroll. A GSAP ScrollTrigger timeline, pinned for 260% of the viewport, drives the dive:
  - the hero copy fades
  - the stage widens
  - the camera lerps into the syahi
  - the syahi fills the screen
  - the iris opens
- Images ease from a 1.22× scale to 1× as they scroll in, and the story banner parallaxes.
- Picking a note in "Hear our dayans" zooms the circular portal.
- With **prefers-reduced-motion**, the site drops the dive, scrubs and smooth scroll, and the statement simply follows the hero.

## The 3D tabla (`build/src/tabla.js`)

Everything is procedural, with no model files, so it stays small and loads lazily after the page.

- **Dayan:** a lathe-turned red sheesham shell (canvas grain texture with a bump map and a lacquer clearcoat), sixteen V-laced cream leather straps built as flat ribbons, and honey-wood gatte.
- **Bayan:** a hammered copper body (dimple bump map, metallic) with tan straps.
- **Heads:**
  - goatskin texture with a darker kinar band and strap holes
  - braided gajra (two twisting strands)
  - a domed syahi with fine concentric layers (an off-centre syahi on the bayan)
  - the SM stamp branded near the edge
- **Lighting and interaction:** room-environment reflections, a soft key-light shadow on an invisible floor, and fabric cushions. Drag to turn the pair, and tap a head to hear Na, Tin, Tun, Ge or Ke (synthesised in `audio.js`).

To rebuild after editing: `npx esbuild src/tabla.js --bundle --format=esm --minify --outfile=../site/assets/tabla.js` from `build/`.

## Logo

The logo is the client's own S-drum mark in brown and gold. For the 0.5 in stamp on drum heads, heat-branding the S mark alone is recommended, because ink fades with sweat.

## Checks run

These were checked at 1440 and 390 px wide on every page:

- no horizontal scroll
- no script errors
- an axe accessibility scan with no violations
- the mobile menu, both dialogs, note switching, and the form's required-field message
- the cookie banner writing its consent setting
- the reduced-motion layout
