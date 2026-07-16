# CIC → ScrubLordKay (SLK) Brand Refresh Plan

Plan to update the look & feel of the **Command Information Center** dashboard using the
**ScrubLordKay Brand Templates** in `E:\GPT_OS\project templates`.

---

## 0. What we're working with

**App (this repo):** React 18 + Vite client, Express server. All UI lives in:
- `src/main.jsx` — app shell, sidebar, topbar, every dashboard view (~1000 lines)
- `src/intelligence.jsx` — Intelligence tab
- `src/styles.css` — the entire design system (290 lines, one `:root` token block + flat class rules)
- `index.html` — no font links yet

**Brand kit (`project templates/`):**
- `ScrubLordKay Brand Template.zip` — a *branded snapshot of this exact app* plus assets & component specs
- `SLK Brand System.html` (6 MB standalone) / `.dc.html` files — the canonical brand definition
- `assets/` — `crest-color.jpg`, `crest-negative.jpg`, `crest-box.jpg`, `sword-wordmark.jpg`
- Component specs: `SLK Panel`, `SLK Button`, `SLK Nav Item`, `SLK Section Head` (`.dc.html`)

**Key finding:** the app *already* ships the SLK **color tokens** (`--scarlet`, `--lavender`,
`--gold`, `--onyx`… in `styles.css:1-23` are byte-identical to the kit's `styles.css`). What the
app has **not** adopted is the evolved **"HUD Console"** visual direction the brand system defines
on top of those tokens. That direction is the actual refresh.

---

## 1. The gap: current app vs. SLK "HUD Console" target

The brand system offers two directions — *Gallery Black* (editorial) and *HUD Console*
(gaming-interface). The kit's own CIC snapshot commits to **HUD Console**, so that's our target.

| Element | Current app | SLK HUD Console target |
|---|---|---|
| **Primary accent** | Scarlet `#DE2B31` (nav active, CTAs) | **Honey/amber `#F4AC45`** — nav active keycap fill, panel brackets. Red demotes to *destructive only*. |
| **Typography** | Inter only | **Space Mono** (labels, meta, hotkeys, system readouts) + **Playfair Display 900** (section numerals) + Segoe UI/Inter (body). Display wordmark uses UnifrakturCook / Zilla Slab. |
| **Panels** | Flat gradient card | Same card **+ amber corner brackets** (HUD reticle motif) |
| **Buttons** | Flat pills | **Keycaps**: 3px bottom "foot" (pressable depth); yellow=primary, cyan=live/media, magenta=community, outline=secondary |
| **Nav active** | Scarlet gradient, light text | **Amber gradient, dark `#0A0A0A` text** (inverted keycap) |
| **Section heads** | Uppercase bold label | **`[ 01 ]` Playfair numeral + Space Mono spaced label + fade rule** |
| **Branding** | Text `<h1>` + circle "K" | **Crest** in sidebar + **sword wordmark**, `// SYS.BRAND — STATUS: ONLINE` microcopy |
| **Categorical palette** | Muted "secondary" set | Full **splatter core**: `#EC0F8C #2323E0 #29ABE2 #2ECC40 #E8221A #FF8C1A #FFE600` for charts/tags |

---

## 2. Canonical brand values (extracted from the kit)

```css
/* Signature accent (NEW primary highlight) */
--honey:   #F4AC45;   /* nav active, panel brackets, primary keycap */

/* Splatter-core categorical (charts, source tags, status) */
--spl-magenta:#EC0F8C; --spl-blue:#2323E0; --spl-cyan:#29ABE2;
--spl-green:#2ECC40;   --spl-red:#E8221A;  --spl-orange:#FF8C1A; --spl-yellow:#FFE600;

/* Type roles */
--font-body:  'Segoe UI', Inter, system-ui, sans-serif;   /* nav, copy, captions */
--font-mono:  'Space Mono', ui-monospace, monospace;      /* labels, meta, readouts */
--font-numeral:'Playfair Display', serif;                 /* section numerals (900) */
--font-display:'Zilla Slab','UnifrakturCook',serif;       /* wordmark only */
```
Motto / voice: **"ONE PERSONA · MOSTLY GAMES"**, system-readout microcopy
(`// SYS.BRAND — BUILD 1.0 — STATUS: ONLINE`, `PING 12ms`).

---

## 3. Implementation phases

Small, reviewable commits. All CSS work is centralized in `src/styles.css`; JSX touch-ups are
localized. **No functional/behavioral changes** — pure look & feel.

### Phase 1 — Foundation (tokens + fonts) · low risk
1. Add Google Fonts `<link>` for Space Mono, Playfair Display (+ Zilla Slab / UnifrakturCook for
   the wordmark) to `index.html`. *(If offline/CSP is a concern, self-host under `src/assets/fonts/`
   with `@font-face` instead of a CDN link.)*
2. In `styles.css :root`, add the new tokens from §2 (`--honey`, splatter-core, font roles).
   Keep existing tokens for backward compatibility.
3. Introduce semantic aliases so later phases swap intent, not hex: `--accent-active: var(--honey)`,
   `--accent-danger: var(--scarlet)`.

### Phase 2 — Navigation & shell · low risk
- `.nav-item.active` (`styles.css:35`): scarlet gradient → **amber gradient + `#0A0A0A` text**
  (`linear-gradient(90deg,#F4AC45,rgba(244,172,69,0.4))`), per `SLK Nav Item.dc.html`.
- Sidebar brand: drop the crest into the sidebar top (`main.jsx:356`) and/or replace the circle
  `.brand-mark` "K" (`styles.css:242`, `main.jsx:331`) with `assets/crest-negative.jpg`.
  Copy kit assets into `src/assets/brand/`.
- Sidebar footer (`main.jsx:372`): render `v1.0.0 · Local App` in Space Mono as a system readout.

### Phase 3 — Panels (HUD brackets) · medium risk
- Extend `.panel` (`styles.css:71`) with amber corner brackets via `::before`/`::after`
  (top-left + bottom-right, `2px solid #F4AC45`, 12px), matching `SLK Panel.dc.html`.
  Optionally gate behind a `.panel.bracketed` class to apply selectively (hero panels first).
- `.panel-title` meta text → Space Mono.

### Phase 4 — Section heads & typography rhythm · medium risk
- Build a numbered section-head treatment (Playfair numeral + Space Mono spaced label + fade rule)
  per `SLK Section Head.dc.html`. Apply to `.section-header` / `.page-header`
  (used ~20× in `main.jsx`; numerals can be CSS counters or explicit props).
- Route all eyebrow/label/meta text to `--font-mono`, uppercase, `letter-spacing:.04–.28em`.

### Phase 5 — Buttons (keycaps) · medium risk
- Restyle `.status-button/.primary-button/.danger-button/.icon-button` (`styles.css:46-51`) as
  keycaps: 3px bottom foot (`box-shadow: 0 3px 0 …`), active-press translate, color roles from
  `SLK Button.dc.html` (primary=honey/red, media=cyan, community=magenta, secondary=outline).

### Phase 6 — Accent recolor & polish · medium risk
- Re-map decorative scarlet → honey where it's *highlight* not *danger*
  (`panel-icon.red`, `source-list`, kanban tops, priority chips). Keep red for genuine
  destructive/error states (`.danger-button`, `.dot.bad`, P1).
- Wire splatter-core palette into charts/source chips/status dots for categorical variety.
- Add `// SYS.` readout microcopy to the topbar (`main.jsx:382`) — LAN status as `PING`, etc.

### Phase 7 — QA
- `npm run build` + visual pass against kit `screenshots/cic-dash.png` & `cic-kanban.png`.
- Check both dashboard & kanban, mobile drawer (`.sidebar` hides <breakpoint, `styles.css:262`),
  and the privacy-blur states. Run `npm test` (styling shouldn't affect it, but confirm).

---

## 4. Sequencing & risk notes

- **Do Phase 1–2 first** and screenshot — the amber nav + crest alone shifts the identity ~60%.
- Each phase is independently shippable; pause for review after Phase 2 and Phase 5.
- **Lowest risk / highest impact:** tokens, nav accent, crest, panel brackets.
- **Watch-outs:** font FOUT (preload/`display=swap`); CDN vs. offline demo mode (self-host option
  in Phase 1); amber-on-dark and black-on-amber contrast (AA — verify with the dataviz palette
  validator); don't recolor semantic red (errors/P1/destructive).
- **Scope discipline:** this is presentational only. No changes to API, data, or component logic.

## 5. Deliverables
1. `index.html` — font links.
2. `src/styles.css` — new tokens + restyled nav, panels, buttons, section heads.
3. `src/main.jsx` (+ maybe `intelligence.jsx`) — crest/wordmark, numbered section heads, readout copy.
4. `src/assets/brand/` — crest + wordmark copied from the kit.
5. Before/after screenshots vs. the kit reference shots.
