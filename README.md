# BoardVitals — Standalone Mock UI

A backend-free, static mock of the BoardVitals learner + institutional (B2B) UI.
Everything is driven by static JSON in `mock-data/` — **no API, database, auth, or
external services required**. Built for stakeholder review.

> ⚠️ This repo contains **no production front-end app** (only the headless
> `board-vitals-shared-js` logic library + `maestro-ui` test flows). This mock was
> **reconstructed from those contracts** — domain factories, Redux actions/reducers,
> selectors, route params, and Maestro element IDs — not copied from real templates.
> See `docs/NOTES.md` for fidelity caveats.

## Run it

It needs a static file server (the app loads JSON via `fetch`, which `file://`
blocks). Any of these work — pick one:

```bash
cd mock-ui

# Option A — Python (preinstalled on macOS)
python3 -m http.server 8080

# Option B — Node
npx serve -l 8080 .
```

Then open **http://localhost:8080/** and sign in (any credentials — auth is mocked;
the form is prefilled, just click **Sign In**).

## What's inside

```
mock-ui/
  index.html              SPA shell
  assets/css/styles.css   design system (brand-faithful approximation)
  assets/js/app.js        router + layout shell + modal/toast/notification hosts
  assets/js/icons.js      inline SVG icon set (no CDN)
  assets/js/data.js       JSON loader + formatters
  assets/js/views/        one module per screen
  mock-data/              static JSON per screen/flow
  docs/                   UI-INVENTORY, IMPLEMENTATION-PLAN, NOTES, CHECKLIST
```

> **Layout note:** the chrome (navy top header + white sub-nav) and the Dashboard are
> modeled on the live product at `stg-bv.ascendlearning.com`. Navigate via the **top
> sub-nav** (Quiz and Performance are dropdowns); the user menu (top-right) holds Account,
> UI States Demo, and Sign out.

## Screens (navigate via the top sub-nav)

- **Login** — entry point (mocked auth, incl. SSO/LTI button)
- **Dashboard** — pass-likelihood, question status, CME snapshot, recent quizzes, weak subjects, **Quick Quiz**
- **Create Quiz** — mode (Tutor/Timed/Adaptive/Practice Exam), question pool, subjects, length
- **Take Quiz** — multiple-choice items, **highlight / strikeout / mark** tools, tutor-mode immediate feedback, question navigator, **Grade Quiz modal**
- **Quiz Results** — score, percentile, peer avg, subject breakdown, question review
- **My Quizzes** — active/archived tabs, archive/unarchive, empty state
- **Question Banks** — subscription cards, switch active bank
- **Performance** — overview, accuracy trend, question-status donut, by-subject vs. peers
- **Readiness** — risk/readiness scoring with recommendation
- **CME Center** — activities, claim-credit flow, certificates, licenses
- **Clinical Pearls** — searchable library with bookmarking
- **Account & Billing** — profile, subscriptions, trial banner, payment methods, sign out
- **Admin Console (B2B)** — member groups, members table, assignments, class reports + leaderboard
- **UI States Demo** — force loading/empty/error; preview alerts, toasts, modals

## Additional screens (this pass)

Reachable from the sub-nav dropdowns, header, and user menu:

- **Search / Browse Questions** — Browse Questions ▾ → Search Questions, or the header search box. Facets, results table, pagination, empty state.
- **Cart & Checkout** — header cart icon (or user menu). Line items + totals; checkout has a payment form with validation + disabled submit.
- **Performance Timeline** — Performance ▾ → Performance Timeline. Study activity over time.
- **Practice Exam Performance** — "Review Practice Exam" sub-nav button. Predicted-pass band + section breakdown.
- **Question Management** (admin) — Admin ▾ → Question Management. Table + pagination, create/edit form with validation, CSV upload.
- **User Management** (admin) — Admin ▾ → User Management. Users table, add-user modal, bulk CSV upload + confirmation snapshot.
- **Usage Reports** (admin) — Admin ▾ → Usage Reports. Org reports list + detail + export.
- **No Subscriptions** / **Not Yet Verified** — user menu → "View: …" (account-state pages).

## Mock data structure (`mock-data/`, 24 files)

One JSON file per screen/flow, kept separate from UI code; loaded via `DB.load('<name>')`
(cached `fetch`). Shapes are inferred from the real factories/selectors/components
(documented in `docs/NOTES.md`). Files: `user`, `question-banks`, `dashboard`,
`quiz-create-options`, `quiz`, `quiz-results`, `quizzes`, `performance`,
`performance-timeline`, `practice-exam-performance`, `risk-assessment`, `cme`,
`cme-certificates`, `clinical-pearls`, `subscriptions`, `notifications`,
`question-search`, `cart`, `questions-admin`, `users-admin`, `usage-reports`,
`b2b-member-groups`, `b2b-assignments`, `b2b-class-reports`.

## Notes for reviewers

- The **active question bank** switcher (top bar) is global; switching it re-renders.
- The **UI States Demo** page lets you force loading/empty/error on data screens.
- Colors, spacing, and the logo are a **brand-faithful approximation** — not the
  production design system (none exists in this repo to copy). See `docs/NOTES.md`.
