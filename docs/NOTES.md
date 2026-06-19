# Notes — reused assets, assumptions, gaps, follow-ups

## Reused assets
**None could be copied.** This repo contains no front-end application — no CSS/SCSS,
images, fonts, icon sets, templates, or color tokens. The only front-end artifact is
`board-vitals-shared-js`, a *headless* Redux/React logic library, plus `maestro-ui`
(mobile E2E YAML flows). The rendered web/mobile apps live in **separate repositories**
not present here.

What we reused instead (the contracts that *are* here):
- **Domain factories** (`src/factories/*.js`) → mock-data field shapes & names
- **Redux actions/reducers/slices/selectors** → screen set, workflows, state matrix
- **`hooks/params.js`** → route shapes (e.g. `/search/:quiz_id/:filter/:question_number`)
- **Maestro flows** → real UI element IDs, reused verbatim where it aids fidelity:
  `new_quick_quiz_button_card_button`, `multiple_choice_option_*` (mapped to answer rows),
  `next_question_button`, `grade_quiz_button`, `grade_quiz_modal_grade_quiz_button`,
  `quiz_results_cancel_button`.
- **`constants.js`** → confirmed feature areas (CME, assignments, member groups, risk, etc.)

## Repo confirmation (verified against live product)
A stakeholder screenshot of **stg-bv.ascendlearning.com** confirmed this is the correct
product/logic repo. Exact-string matches proving it:
- `helpers/riskCategoryHelper.js:1` defines `['At Risk', 'Needs Improvement', 'On Track',
  'Not Enough Data']` = the on-screen **Subject Risk Distribution** legend, verbatim.
- `actions/quizzes.js:501` `quizzesQuickCreate({ numberOfQuestions = 10, isAtRisk })` =
  the **Quick Start Quiz** (10 Q) and **At Risk Quiz** dashboard buttons.
- Question Status (Answered/Unanswered/Unseen), Peer Rank percentile, CME AMA PRA Cat 1™,
  Admin/Assignments, Review Practice Exam, Browse/Search Questions all map to repo code.
The **rendering React app (components/CSS/layout) is in a separate repo**, not here — so
the layout was realigned to the screenshot (top nav, 3-column dashboard), not copied.

## Assumptions
1. **Visual design** — navy header + teal/blue accents, card layout. Now **modeled on the
   real screenshot** (top navy header with centered Question Bank switcher, EXP badge,
   Help Center, user menu; white sub-nav: Admin/Dashboard/Quiz/Performance/My CME/CE/Review
   Practice Exam/Browse/Search). Exact hexes, logo glyph, and fonts are still approximations.
2. **Information architecture** — sub-nav matches the screenshot; Quiz & Performance are
   dropdowns (Create/My Quizzes; Performance/Readiness) so all views remain reachable.
3. **API envelope** — the real API is JSON:API style
   (`{ data: { type, id, attributes } }`, per `helpers/api.js` + factory `jsonType`).
   Mock JSON uses a **flattened, readable shape** for clarity. A thin adapter would be
   needed to wire these screens to the real API.
4. **Immutable.js** — production state is Immutable.js (`.get()`, `Map`, `List`). The
   mock uses plain JS objects; not a concern for a static replica.
5. **Tutor mode** — assumed to mean "show explanation immediately after answering"
   (`tutor_mode_enabled` on User). Implemented that way in Take Quiz.
6. **Roles/tenants** — learner is the default. B2B admin is shown as one console;
   real role gating (instructor vs. delegate vs. staff) is simplified.
7. **Sample content** — clinical/medical content is illustrative and **not for
   clinical use**.

## Known gaps / not yet built
- **Board-exam interfaces** (PSI / FRED / Pearson VUE) — represented by one generic
  timed quiz view rather than three pixel-exact emulations.
- **NGN / dental item types** — represented structurally (flag + standard MCQ), not as
  bowtie/case-study/hotspot interactions.
- **Per-question full review screen** (E2) — review is summarized in the results table;
  a dedicated per-question explanation viewer is a follow-up.
- **CME Coach** (G5), **Device registrations** (I5), **Exam template builder** (J5),
  **Bulk user creation wizard** (J6) — referenced in nav/buttons but shown as
  toasts/stubs, not full flows.
- **Offline sync** states (mobile) — out of scope for this web mock.
- **Notifications** are a read-only dropdown (no mark-as-read persistence).

## Follow-up items
1. Confirm real **brand tokens** (colors, logo SVG, font) and swap into `styles.css` /
   `assets/img/` for true visual replication.
2. If wiring to real data later, add a JSON:API → flat adapter so `mock-data/` shapes
   match `data.attributes`.
3. Build out the deferred flows above if they're in review scope.
4. Extend the same approach to the **mobile UI** (the Maestro flows target a native app
   — `appId: com.boardvitals.stg`).
