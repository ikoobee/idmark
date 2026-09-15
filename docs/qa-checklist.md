# Manual QA Checklist

> Run the core paths after any change to `js/` or `index.html`; run the full
> list after large changes.
> Environment: latest Chrome/Edge plus one phone (iOS Safari first — verifies
> the huge-image guard and clipboard fallback).

## A. Upload (three channels)

- [ ] Click the dropzone and pick multiple JPG/PNG files
- [ ] Drag image files onto the dropzone (dragging anywhere on the page must
      not make the browser open the image)
- [ ] Paste a screenshot with Ctrl+V
- [ ] Pasting **text** into the watermark-text input is not hijacked as an upload
- [ ] Over 20 files: toast shown, only 20 kept
- [ ] Thumbnail delete: deleting a middle image keeps the others' rotations in sync

## B. Rotation

- [ ] Per-image rotate button: 0 -> 90 -> 180 -> 270 -> 0 cycles, thumbnail follows
- [ ] Generate at 90/270: output canvas w/h swapped, no black bars, no cropping
- [ ] Watermark positions follow the rotated orientation (top-right = visual
      top-right after rotation)

## C. Watermark position and parameters

- [ ] Tile: density 2..10 all effective (>10 / <2 clamped)
- [ ] Center: single- and multi-line texts both centered
- [ ] Each corner tl/tr/bl/br once: text hugs the corner, right corners
      right-aligned, top corners stack downward, bottom corners stack upward
- [ ] Density input disabled when mode is not tile
- [ ] Size slider: 1% vs 8% visibly different on the same image
- [ ] Color swatches / custom picker stay in sync

## D. Huge-image guard

- [ ] ~48MP sample (about 8000x6000): generates, output ~4096x3072,
      "auto-compressed" toast shown
- [ ] Normal images: no downscale toast
- [ ] iOS Safari large image does not blank

## E. Templates and language

- [ ] Purpose dropdown: presets compose into the text; "Other (custom)"
      appears exactly once and reveals the custom input
- [ ] Date defaults to today and tracks edits; once the text is manually
      edited, purpose/date changes don't overwrite it ("restore template"
      brings it back)
- [ ] Language switch: UI/title/buttons/dropdowns all switch; `?lang=en`
      direct link works; template text follows the language
- [ ] Persistence: switch to English -> reload stays English; clearing
      localStorage returns to zh-CN; `?lang=` always outranks storage
- [ ] Last-text recall: after reload the textarea holds the last text;
      purpose changes can still restore the template
- [ ] Defaults single source: first paint and after "reset" the controls
      match (position/density/color/size/opacity)

## F. Export

- [ ] Single download: default name contains `_watermarked_` and a
      timestamp; removing the extension auto-restores it
- [ ] Copy to clipboard: paste into a chat window to verify (button hidden
      on non-secure HTTP contexts)
- [ ] Download all: multiple files not blocked (350ms spacing)
- [ ] Output EXIF removed (verify no GPS/device info in a viewer)

## G. Analytics

- [ ] With `provider: 'none'`: no analytics requests in the Network panel
- [ ] With GA4/umami configured: generate/download/copy/lang_change events
      observable
