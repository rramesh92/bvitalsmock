# Mock UI — Implementation Plan

## Goal
A standalone, backend-free static mock of the BoardVitals learner + B2B UI,
driven entirely by static JSON. Runs with any static file server. Built for
stakeholder review without auth/DB/API.

## Tech choice
- **Vanilla HTML + CSS + JS (no build step).** SPA shell with a tiny hash router
  so the shared header/sidebar are written once. Views fetch local mock JSON via
  `fetch()`.
- Rationale: zero install, trivial to run (`python3 -m http.server`), easy to
  review, no framework lock-in. The real product is React/Redux, but a no-build
  replica maximizes reviewability. Component boundaries mirror the real hooks.

## Folder structure
```
mock-ui/
  index.html               # SPA shell (loads CSS + app.js)
  README.md                # run instructions
  assets/
    css/styles.css         # design system (tokens, layout, components)
    js/
      app.js               # router, layout shell, nav, toast/modal host
      data.js              # fetch helpers + formatters
      views/*.js           # one module per screen
    img/                   # logo + inline SVG icons (self-authored placeholders)
  mock-data/*.json         # static data per screen/flow
  docs/
    UI-INVENTORY.md
    IMPLEMENTATION-PLAN.md
    CHECKLIST.md
    NOTES.md
```

## Build order (priority: learner core → analytics/CME → B2B)
1. Shell: header, sidebar, router, toast + modal hosts, design tokens.
2. Login (A1) — visual entry point, "sign in" → dashboard.
3. Dashboard (B1) + question-bank switcher (B2).
4. Create Quiz (C1/C2) incl. modes & subjects.
5. Take Quiz (D1–D5) incl. grade modal, tools, tutor feedback.
6. Quiz Results (E1/E2) + My Quizzes (E3).
7. Performance (F1/F2/F3) + Risk assessment (F4).
8. CME tracker + certificates (G1/G3).
9. Clinical Pearls (H1).
10. Account / Subscriptions (I1/I2/I4).
11. B2B admin: member groups, assignments, class reports (J2/J3/J4).
12. State demos: loading / empty / error toggles on list screens.

## Mock JSON files
`user.json`, `question-banks.json`, `dashboard.json`, `subjects.json`,
`quiz-create-options.json`, `quiz.json` (questions+answers), `quiz-results.json`,
`quizzes.json` (list), `performance.json`, `risk-assessment.json`, `cme.json`,
`cme-certificates.json`, `clinical-pearls.json`, `subscriptions.json`,
`notifications.json`, `b2b-member-groups.json`, `b2b-assignments.json`,
`b2b-class-reports.json`.

Shapes inferred from factory `defaults` + `afterUpdate` and selectors. Where the
exact API envelope is unknown we use a flattened, readable shape and document it
in NOTES.md (real API is JSON:API `{data:{type,id,attributes}}`).

## Reused assets
- **None copyable** — repo has no CSS/images/fonts. We reconstruct a brand-faithful
  design system (teal/navy medical-SaaS palette, system font stack) and self-author
  SVG icons + a wordmark placeholder. Documented in NOTES.md.

## Known gaps / assumptions
- Exact pixel spacing, real logo, and production color hexes are approximated.
- Board-exam interfaces (PSI/FRED/Pearson VUE) represented as one generic timed view.
- NGN/dental item types represented structurally, not pixel-exact.
- LTI/SSO launch shown as a note, not a full external handshake.
