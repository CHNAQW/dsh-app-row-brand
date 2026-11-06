# dsh-app-row-brand

Puts your own image and text inside the **window title bar** of the DeepSeek
Harness desktop shell — the 40px row that holds the sidebar toggle, the native
应用 / 编辑 menus and the minimize / maximize / close buttons. A **Title bar**
page in Settings edits the content.

## What it does

- Registers one entry into the frame-wide `shell.overlay` slot and pins a strip
  to the viewport top, inside the title-bar area that the shell paints for
  `[data-windows-titlebar]`. Nothing inside a column is replaced, so the
  sidebar's own brand row stays as shipped.
- Holds a list of up to 12 items. With more than one item the strip rotates:
  every item has its own display time in seconds (stored as `durationMs`).
- Each item carries text, text color, font family, font size, bold, underline,
  image, image width, alignment, and an optional shimmer.
- Fonts are read from the machine: the Local Font Access API when the shell
  grants it, otherwise canvas metric probing over a candidate list, so the
  Settings picker lists the families that are actually installed.
- Shimmer is the status-widget technique: the glyphs are filled with a
  horizontally repeating gradient whose highlight tile advances one tile per
  cycle, clipped to the text. Cycle time (seconds), highlight color and sweep
  direction (left to right by default, or right to left) are per item.
- The displayed item can be stepped manually and pinned: a pinned item stays on
  screen and stops the rotation until it is unpinned.
- Any item can be marked **temporarily hidden**: rotation, Previous and Next
  skip it, and its entry in the picker shows a “hidden” badge. Unhiding brings
  it straight back into the rotation (and a pin on it becomes active again).
- The image height is locked to the title-bar height (40px); only its width is
  configurable (8–240px).
- Uploaded images are scaled to the bar height and stored as a data URL in
  `localStorage`; an image link can be used instead.
- Outside the Windows desktop shell the strip renders nothing, so a plain web
  page is unaffected.

## Install

From npm:

```shell
dsh plugin --profile <profile> add dsh-app-row-brand
```

From this checkout:

```shell
dsh plugin --profile <profile> add <path-to-this-folder>
```

In DSH Desktop use the plugin manager instead of the command line, and restart
the app once so the renderer picks up a brand-new client module. Later edits to
a linked checkout hot-reload.

Open **Settings → 标题栏 / Title bar** to edit the items.

## Settings

| Field | Effect |
|---|---|
| Items | select an item, add or remove one |
| Order | move the selected item up or down; rotation follows the new order |
| Visibility | temporarily hide the selected item; rotation, Previous and Next skip it |
| Display control | Previous / Pin (toggle) / Next, plus the current “showing N of M” state |
| Text | item text, up to 60 characters |
| Color | swatch plus R/G/B inputs |
| Font / size | installed fonts with a Custom… escape hatch; 9–40px |
| Bold / underline | font weight 700 and underline |
| Image / width | upload, link or clear; width 8–240px |
| Alignment | center / right / left inside the bar |
| Shimmer | on/off, cycle in seconds, sweep direction, highlight color |
| Display time | per-item dwell time in seconds before the next item |

## How it is wired

| File | Role |
|---|---|
| `cordis.patch.yml` | Profile layer: inserts the `dsh-app-row-brand` row |
| `index.js` | Host half: empty `apply()` |
| `client.js` | Browser half: the overlay strip, the carousel and the Settings page |
| `locale/*.json` | Plugin-page title and description |

`package.json` declares `dsh.bundle.patch` (makes the package a profile layer)
and `dsh.client` with `inject`, naming the two slot owners the browser half
extends: `@deepseek-ai/dsh-client-ui-layout` (frame + `shell.overlay`) and
`@deepseek-ai/dsh-client-ui-settings`.

## Limits

- Values are stored per browser profile in `localStorage`, not in the profile's
  plugin config.
- Uploaded images are re-encoded to PNG at 4× the bar height; very large
  pictures may exceed the local storage budget and are rejected.
- The strip is a drag region and does not intercept pointer input.
- Rotation only advances while the strip is mounted (desktop window present).

## License

MIT — see [LICENSE](./LICENSE).
