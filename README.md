# JFRESH OS — Phase 1: Business Foundation

The seven connected Phase 1 visuals for JFRESH OS, built as responsive HTML pages that share one design system.

**Simple Frontline. Powerful Management. One Connected JFRESH OS.**

## View it

Open `index.html` in a browser. No build step and no server needed.

| # | Visual | File |
|---|--------|------|
| 01 | Business Model Overview | `visuals/01-business-model.html` |
| 02 | System Scope Architecture | `visuals/02-system-scope.html` |
| 03 | User & Role Map | `visuals/03-user-role-map.html` |
| 04 | End-to-End Operational Flow (Golden Workflow) | `visuals/04-golden-workflow.html` |
| 05 | Business Rules & Control | `visuals/05-business-rules.html` |
| 06 | Performance & SLA Architecture | `visuals/06-kpi-sla.html` |
| 07 | Master Data Relationship Diagram | `visuals/07-master-data.html` |

`preview.html` shows any visual in PC, iPad and mobile frames side by side.

## Three form factors

Each page changes its layout, not just its size:

| Form factor | Width | Purpose |
|---|---|---|
| PC Report | ≥ 1240 px | Owner, CEO, management. Full diagrams, matrix, swimlane, ERD. |
| Operational iPad | 700–1239 px | Supervisor and floor teams. Large cards, accordions, fewer columns. |
| Mobile | < 700 px | Pickup, driver, alerts. Single column, expandable cards, one main action. |

## Language

Bahasa Indonesia is the default. The ID | EN switch in the top bar swaps every label. It is stored per browser.
In the HTML, the Indonesian text is the element content and the English text is in `data-en`.

## Brand

- Official logo: `assets/brand/jfresh-logo.png`. It is cropped from the uploaded original (`assets/brand/source/jfresh-logo-original.jpeg`), with the circular frame removed and the background set to white. The artwork, ratio and colors are unchanged.
- Never redraw, recolor, stretch or simplify the logo. Place it on white with clear space.
- When a higher-resolution or vector original is available, replace `jfresh-logo.png` with it (same file name) and every page picks it up.

## Design system

`assets/css/jfresh.css` holds the tokens (deep blue `#0754A6`, fresh blue `#00A8E8`, orange `#F7931E`, yellow `#FFC72C`, soft background `#F6F9FC`, and green / amber / red used only for status), type scale per form factor, and shared components (panels, tiles, flows, chains, chips, buttons, KPI tiles, accordions).
`assets/js/icons.js` is the single icon set. `assets/js/jfresh.js` renders the top bar, pager, language switch, responsive accordions and the SVG diagrams.
