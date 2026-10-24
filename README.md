# 🎨 Paletto — Colour Palette Generator

Generate harmonious colour palettes in the browser, copy any hex code with one click, and keep
the ones you like. Built with vanilla HTML, CSS and JavaScript — no frameworks, no build step.

## ✨ Features

- **Harmonious palettes**, not random noise: colours are generated in HSL around one base hue
  - Auto (picks a scheme for you), Analogous, Complementary, Triadic, Split-complementary, Monochrome
- **1–8 colours** per palette with a stepper
- **Copy any hex** from its swatch, confirmed with an inline "Copied!" toast
- **Export all** hex codes to the clipboard in one press
- **Lock a swatch** (the padlock) so the next Generate keeps that colour in its slot while the
  others refresh; **Unlock all** releases them, and shrinking the palette clears locks it can't hold
- **WCAG contrast grades on every swatch** — each card computes its real contrast ratio against
  black or white and shows the grade (AAA ≥ 7, AA ≥ 4.5, AA large ≥ 3), and picks the legible
  text colour for the hex, badge and buttons
- **Saved palettes persist** in `localStorage` — reload the page and they are still there
- Click a saved palette to load it back (hex values are preserved exactly)
- Delete saved palettes individually; the empty state comes back when the last one goes
- Duplicate palettes are detected instead of being saved twice
- **Space bar** generates a new palette, and is ignored while a control or the select has focus
- Responsive layout: the strip stacks into full-width swatches on phones

## 🚀 How to Use

1. Pick a harmony (or leave it on **Auto**) and how many colours you want
2. Hit **Generate** or press `Space`
3. Click a swatch's copy icon for its hex, or **Export All** for the whole set
4. Press **Save** to keep the palette; click a saved palette to bring it back

## 🛠️ Built With

- HTML
- CSS
- JavaScript (Vanilla)
- `localStorage` for saved palettes, Clipboard API with a fallback

## 📁 Project Structure

```text
random-color-palette/
├── index.html
├── style.css
├── app.js
└── README.md
```

## 📌 Concepts Practiced

- HSL → hex conversion and colour-wheel relationships
- Building DOM in fragments instead of string-concatenated `innerHTML`
- Event delegation for swatch copy and saved-palette actions
- Persisting and rehydrating state with `localStorage`
- Keyboard handling that respects focused controls (`preventDefault`, tag checks)
