# Design source

Figma: main ARGUS file `wEcJm3VFUolyO5kO8n7Itd`.

Link format: `https://www.figma.com/design/wEcJm3VFUolyO5kO8n7Itd?node-id=<id with - instead of :>`

| Page | Node | What |
|---|---|---|
| 29 — CLIENT FEEDBACK · PLAN | `292:49` · frame `295:3` | Flow (client → form → DB → n8n → Sheet → alerts → dashboard → post), what we build, the 18 Sheet columns, 3 n8n workflows |
| 30 — CLIENT FEEDBACK · FORM | `292:50` | Form components + screens |
| 31 — CLIENT FEEDBACK · DASHBOARD | `292:51` | Dashboard components + screens |

**Page 30 (form):**

- Components frame `297:9`:
  - FB / Lang switch `297:22`
  - FB / Star `297:28`
  - FB / Rating `297:162` (Size L/M/S × Value 0–5)
  - FB / Chip `297:170`
  - FB / Field `299:87` (Text/Area × Default/Focus/Filled)
  - FB / Checkbox `299:97`
  - FB / Option `299:110`
  - FB / Upload `299:126`
  - **FB / Founder photo** `317:457` (Portrait / Circle). Change its image once and every screen updates.
  - **FB / Backdrop** `317:1485` (Mobile / Desktop)
- Screens:
  - M1 EN `301:93`
  - M2 বাংলা `301:223`
  - M3 filled `301:357`
  - M4 submitting `303:263`
  - M5 thank-you 4–5★ `303:399`
  - M6 thank-you 1–3★ `303:456`
  - M7 link not active `303:502`
  - D1 desktop form `304:358`
  - D2 desktop thank-you `304:519`

**Page 31 (dashboard):**

- Components frame `306:3`:
  - DB Icon/* (19 icons)
  - DB / Pill `306:91`
  - DB / Toggle `306:97`
  - DB / Button `306:119`
  - DB / Icon button `306:129`
  - DB / Avatar `306:131`
  - DB / Nav item `306:152`
  - DB / KPI `306:154`
  - DB / Sidebar `309:315`
  - DB / Client row `309:317`
  - DB / Feedback row `309:374`
- Screens:
  - DB1 Login `310:196`
  - DB2 Overview `310:219`
  - DB3 Clients `312:347`
  - DB4 Add client `312:865`
  - DB5 Client detail `312:1453`
  - DB6 Feedback + drawer `314:1136`
  - DB7 Settings `314:1653`

## Tokens (Figma "ARGUS / Colors", Dark mode = code)

| Token | Hex | Tailwind |
|---|---|---|
| bg/primary | #0B0D0C | `bg-bg` |
| bg/secondary | #131614 | `bg-bg-2` |
| surface/primary | #171A18 | `bg-surface` |
| surface/elevated | #1E2321 | `bg-surface-2` |
| border/subtle | #2A2F2C | `border-line` |
| border/strong | #3A413D | `border-line-strong` |
| text/primary | #F7F7F2 | `text-text` |
| text/secondary | #C9CFCB | `text-text-2` |
| text/muted | #7F8984 | `text-muted` |
| accent/primary | #2BF2A1 | `mint` |
| accent/hover | #0FD888 | `mint-hover` |
| accent/soft | #10261D | `mint-soft` |
| text/on-accent | #06110C | `on-mint` |
| deep green | #0B5E4E | `deep` |
| warning / soft | #F59E0B / #2A2210 | `warning` / `warning-soft` |
| error / soft | #EF4444 / #2B1614 | `error` / `error-soft` |
| info / soft | #3EA6FF / #0F1E2A | `info` / `info-soft` |

**Type:**
- Space Grotesk Bold/Medium for titles.
- Geist 13–15 for UI.
- Geist Mono Medium 11, uppercase, for labels.
- Noto Sans Bengali for বাংলা.

Figma exports in `docs/figma/`: `figma-plan.png`, `figma-form-components.png`, `figma-dashboard-components.png`.

The code is the up-to-date reference: `docs/screenshots/*` show every built screen and state, and `/design` (or `00-components-style-guide.png`) shows every component variant.

Planning documents from the design phase (in Banglish) are in `docs/design-notes/`.
