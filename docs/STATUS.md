# STATUS — read this first when resuming

_Single source of truth for picking the mock UI back up. Last updated end of the
B2C / ATI / LTI / NGN build pass._

## What this is
A standalone, backend-free static mock of the BoardVitals product, under `mock-ui/`.
Pure vanilla HTML/CSS/JS SPA (hash router), static JSON in `mock-data/`. No build step.

## Run it
```bash
cd mock-ui && python3 -m http.server 8080   # then open http://localhost:8080
```
- Logged out → lands on the **B2C storefront**. Sign in (any creds; mocked) → app.
- 29 view files, 26 mock-data JSON files.

## Flows covered (all of `ObsidianVaults/.../BoardVitals.md`)
- **B2C (no-login):** storefront → product/pricing → register → cart → checkout → dashboard
- **B2B (institutional):** Admin ▾ → Classes (+ class detail/students) + Assignments
- **Learner:** dashboard, create quiz, take quiz + **review** interface, results, my quizzes,
  performance by subject, performance timeline, CME, clinical pearls, account, search, practice-exams modal
- **ATI** embed + **LTI** launch (reachable via the user menu "View:" links)
- **Quiz modes** Test/CAT/Tutor/Study; **NGN** items (dropdown-cloze + matrix) interactive
- Shared: top nav + dropdowns, footer, notifications, toasts, modals, loading/empty/error (UI States Demo)

## Verified vs. NOT yet verified
- ✅ All JS pass `node --check`; all JSON parse; no global-scope name collisions; all
  `DB.load()` + `Icon` refs resolve; every view wired in `index.html`; **all routes render
  clean** via the headless DOM harness; server serves 200.
- ✅ Visually confirmed against staging (screenshots): dashboard, B2B Classes/detail/Assignments,
  learner quiz **review** interface, Performance by Subject, Performance Timeline, Practice Exams modal.
- ⚠️ **NOT yet eyeballed in-browser** (built + render-verified only, MCP browser had
  disconnected): the new **B2C storefront / product-page / register**, **ATI**, **LTI**, and
  the **NGN** quiz items. First resume step: open them at localhost:8080 and tighten visuals.

## How to resume matching more flows against staging
1. Creds + login recipe: `docs/STAGING-ACCESS.md` (also in memory `boardvitals-staging-access`).
2. Use the chrome-devtools MCP. If its profile is locked, kill the orphaned automation Chrome:
   `pkill -f "chrome-devtools-mcp/chrome-profile"` (do NOT use `-9` on the whole match — that
   killed the MCP server's own connection last time; target gently or just retry the MCP call).
3. The shell's `node` is a broken nvm shim — use `/opt/homebrew/bin/node`. PATH sometimes drops
   `/usr/bin`; prefix `export PATH=/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin` or use absolute bins.
4. Real source of truth for pixel matching: cloned web app at
   `services/bv/boardvitals` (Rails+ERB+SCSS+React); brand tokens in `_variables.scss`.

## Doc map (`mock-ui/docs/`)
- **STATUS.md** (this file) — resume here
- **REMAINING-WORK.md** — gap analysis + flow-coverage table + out-of-scope
- **CHECKLIST.md** — discovered-vs-implemented + every live-traversal correction log
- **UI-INVENTORY.md** — screen inventory · **IMPLEMENTATION-PLAN.md** — architecture
- **NOTES.md** — assumptions / reused assets / repo-confirmation
- **STAGING-ACCESS.md** — non-prod URL + test logins + login steps

## Known open items / next candidates
- Eyeball + tighten the un-eyeballed new screens (above).
- ATI/LTI built from doc description only (no live access) — refine if access is granted.
- Still structural-only: bowtie / hotspot / drag-drop NGN; PSI/FRED/Pearson-VUE exam interfaces.
- Mobile (React Native app cloned at `services/bv/boardvitals-react-native-app`) not mocked.
