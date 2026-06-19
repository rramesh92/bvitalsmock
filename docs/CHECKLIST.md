# Implementation Checklist — discovered vs. implemented

Legend: ✅ implemented · 🟡 partial / stubbed · ⬜ not built (gap)

## Shared chrome & system
- [x] ✅ Sidebar navigation (grouped) + active state
- [x] ✅ Top bar with question-bank switcher (global, re-renders)
- [x] ✅ User chip → Account
- [x] ✅ Notifications bell + dropdown panel + unread badge
- [x] ✅ Toast system (info / success / error)
- [x] ✅ Modal system (standard + destructive)
- [x] ✅ Loading (skeleton) states
- [x] ✅ Empty states
- [x] ✅ Error states + retry
- [x] ✅ Responsive grid (collapses on narrow screens)

## A. Auth
- [x] ✅ A1 Login (mocked)
- [x] 🟡 A2 SSO / LTI launch (button → mocked sign-in)
- [x] ✅ A3 Logout (Account → Sign out)

## B. Home
- [x] ✅ B1 Dashboard (stats, quick quiz, question status, CME snapshot, recent quizzes, weak subjects)
- [x] ✅ B2 Question-bank selection / switch

## C. Quiz creation
- [x] ✅ C1 Quick Quiz (dashboard card + nav)
- [x] ✅ C2 Custom Create Quiz (mode, pool, subjects, length, summary)
- [x] 🟡 C3 Adaptive/CAT (selectable mode; length preset)
- [x] 🟡 C4 Practice Exam (selectable mode + templates in data)

## D. Quiz taking
- [x] ✅ D1 Multiple-choice question view (stem, answers, peer %)
- [x] ✅ D2 Tutor-mode immediate feedback + explanation
- [x] ✅ D3 Tools: highlight, strikeout, mark
- [x] ✅ D4 Navigation (prev/next + question palette)
- [x] ✅ D5 Grade Quiz modal
- [x] 🟡 D6 Timed interface (live timer; not full board-exam emulation)
- [x] ⬜ D7 NGN / dental item types (structural only)

## E. Results & review
- [x] ✅ E1 Quiz results summary (score, percentile, peer avg, subject breakdown)
- [x] 🟡 E2 Per-question review (summarized in table; no dedicated viewer)
- [x] ✅ E3 My Quizzes list (active/archived, archive/unarchive, empty state)

## F. Performance / analytics
- [x] ✅ F1 Performance overview
- [x] ✅ F2 By-subject performance
- [x] ✅ F3 Peer comparison (▲/▼ vs peer)
- [x] ✅ F4 Readiness / risk assessment

## G. CME
- [x] ✅ G1 CME tracker / dashboard
- [x] ✅ G2 Claim CME flow (modal, license field)
- [x] ✅ G3 Certificates list + download (mocked)
- [x] ✅ G4 Licenses & requirements
- [x] ⬜ G5 CME Coach

## H. Clinical Pearls
- [x] ✅ H1 Pearls library (search + bookmark)
- [x] 🟡 H2 Pearl detail (inline summary; no full detail page)

## I. Account / subscriptions
- [x] ✅ I1 Account / profile
- [x] ✅ I2 Subscriptions & plans (+ trial banner)
- [x] ✅ I3 Payment methods
- [x] ✅ I4 Board exam date
- [x] ⬜ I5 Device registrations (mobile)

## J. B2B / institutional admin
- [x] ✅ J1 Org context (admin console header)
- [x] ✅ J2 Member groups + members table
- [x] ✅ J3 Assignments (list + create modal)
- [x] ✅ J4 Class reports (cohort vs national + leaderboard + export)
- [x] ⬜ J5 Exam template builder
- [x] 🟡 J6 Bulk user creation (button → mocked)

## Role / tenant variations
- [x] ✅ Learner (default experience)
- [x] ✅ Tutor mode (immediate feedback in Take Quiz; toggle on Performance)
- [x] ✅ B2B admin (Admin Console)
- [x] 🟡 Institutional learner / LTI (data present; no separate embedded view)

## Deliverables
- [x] ✅ Standalone mock UI directory (`mock-ui/`)
- [x] ✅ Static pages/components
- [x] ✅ Mock JSON data files (18 files)
- [x] ✅ Local run instructions (`README.md`)
- [x] ✅ UI inventory (`docs/UI-INVENTORY.md`)
- [x] ✅ Implementation plan (`docs/IMPLEMENTATION-PLAN.md`)
- [x] ✅ Notes: reused assets / assumptions / gaps (`docs/NOTES.md`)
- [x] ✅ This discovered-vs-implemented checklist

## Coverage summary
**Discovered screens/areas:** ~40 · **Implemented (full or partial):** ~36 · **Explicit gaps:** D7, G5, I5, J5 (4), plus partials noted above.

---

## Real-source porting (COMPLETE)
After cloning the real web app (`services/bv/boardvitals`, Rails+ERB+SCSS+React), every
screen was re-derived from the actual components/SCSS rather than inference:

| Cluster | Matched against (real source) |
|---|---|
| **Chrome + Dashboard** | `_top_dashboard_nav.html.erb`, `pages/DashboardHomePage.jsx` + `_DashboardHomePage.scss`, `StartQuizPanel.jsx`, `PerformancePie/Chart/RiskPieComponent`, `CmeMoc` |
| **Quiz flow** | `CreateQuizForm/*`, `pages/quizzes/CreateQuizPage.jsx`, `TakeQuizPage/EnhancedLearning/*`, `Question/MultipleChoiceQuestion.jsx`, `Explanation.jsx`, `pages/quizzes/QuizReportPage.jsx` |
| **Progress** | `PerformanceOverview`/`PerformanceSubjectsTable`, `RiskPieComponent` + `riskCategoryHelper`, `MyCmePage`/`CmeListItem`/`CmeCertificateList`, Clinical Pearls filter+table |
| **Account + lists** | `SettingsPage` (Profile/My Products/Reset Password/Credit Cards), `lists/QuizzesTable`, storefront cards, Devise `sessions/new` |
| **B2B admin** | `ClassesPage/ClassesList/ClassView`, `AssignmentsList`, `ClassesPerformance`/`SubjectsList` |

**Real brand tokens applied** (`_variables.scss`): navy `#1b3950`, tutor-blue `#2c6dd4`,
blue `#0044db`, fern-green `#487b09`, ice-blue `#ecf5fb`; real risk palette
(`#327d1c`/`#f76902`/`#df0000`/`#a5a5a5`). Real white logo PNG used in the header.

**Verification:** 17/17 JS files pass `node --check`; 17/17 JSON parse; no global-scope
name collisions; all `DB.load()` files + `Icon` refs + nav routes resolve; **14/14 views
render without runtime error** via a headless DOM harness, including forced
loading/empty/error states. Maestro element IDs preserved in the quiz flow.

**Still mocked/stubbed (per scope):** tool overlays (calculator/lab values/notes),
PDF/CSV downloads, real auth (Devise form is an external Angular widget — surrounding
panel matched, sign-in mocked), and board-exam-interface emulations (PSI/FRED/Pearson VUE).

---

## Gap-completion pass (COMPLETE) — see `REMAINING-WORK.md`
Compared the mock against the real React Router route table and filled the gaps:

**+10 new screens:** Search/Browse Questions, Cart, Checkout, Question Management (admin),
User Management + bulk upload (admin), Performance Timeline, Practice Exam Performance,
Usage/Organization Reports (admin), No Subscriptions, Not Yet Verified.

**Shared/states added:** site **footer** (NavigationFooter — Support/Company/Resources/
Mobile App + social), header **cart** icon, **pagination** (search/question/user tables),
**form validation + disabled submit** (checkout, question form, add-user), Admin & Performance
**nav dropdowns**, edge-state pages reachable via user menu.

**Final coverage:** 24 routes / 24 mock-data files. Discovered real routes ≈ 50
(incl. deep B2B CRUD sub-routes); all top-level user + admin workflows implemented.
Remaining deep B2B sub-routes (assignment-template CRUD, per-class report drill-in,
select-priority-org) folded into existing tabs or documented as gaps.

**Verification:** all 24 JS views + core files pass `node --check`; all 24 JSON parse;
no global-scope name collisions; all `DB.load()` (23) + `Icon` (19) refs resolve;
**24/24 routes render with zero runtime errors** via the headless DOM harness; server
serves 200; browser loads. No production code modified.

---

## Live-traversal corrections (logged into stg-bv.ascendlearning.com as instructor)
Logged into the real staging site (institutional/instructor account) via browser
automation, traversed Dashboard → Admin → Classes → Class detail → Assignments, and
corrected the mock to match what's actually rendered:

- **Header:** `EXP: N DAYS` badge → green **EXTEND** button (title "Plan Ends: …");
  **CME/MOC** card button `Upgrade` → **Claim CME Credits**.
- **Sub-nav:** **Clinical Pearls** and **My CME/CE** are now top-level links (were under
  Browse); **Practice Exams** button; **Admin** menu = **Classes + Assignments**
  (then the extra mock admin screens). Quick Start Quiz now shows an **Edit** button.
- **Institutional admin (rebuilt `b2b.js`)** to mirror the real instructor area:
  - **Organization** context bar ("Test Medical College") + Instructor badge; internal
    **Classes / Assignments** tabs.
  - **Classes:** My Classes / Delegated Classes tabs, Class Name search, View Archived
    Classes, **Create New Class**, table = Class Name / Recipients / Delegates / Class
    Created + View | Edit | Archive — using the real class rows.
  - **Class detail:** "{name}" + Class Performance button, "{date} | N Recipients |
    N Delegates | Edit Class", `< Back`, **Students** table (Email / First / Last +
    View Performance | View Quizzes | Remove), **Delegates → No Delegates Found**.
  - **Assignments:** Create Assignments panels (New / Existing Template + Adaptive Exam
    with the real explanatory copy), Assignments / LMS / Delegated tabs, View Archived,
    table = Name / Class / Template / Question Bank / Completed / Start / End.
- Mock data (`b2b-member-groups.json`, `b2b-assignments.json`) refreshed with the real
  class names, recipient/delegate counts, students, and assignment rows.

**Note:** the global header still shows the learner "Question Bank" switcher; in the real
app the chrome swaps to an "Organization" switcher in admin context. The mock conveys
this via an in-page Organization bar inside the Admin area (documented deviation).
Re-validated: 27/27 routes (incl. `b2b/classes`, `b2b/assignments`, `b2b/class/:id`)
render clean.

---

## Live-traversal corrections — student/learner flow (logged in as a student)
Logged into stg-bv as a learner (institutional student) and traversed Dashboard →
Create Quiz → Quiz Report → **Review Questions** (the live quiz/review interface):

- **Create Quiz** confirmed: Quiz Mode split into "Answers & explanations available
  **after** the quiz" (Test / Adaptive) vs "**during** the quiz" (Tutor / Study-Open Book),
  Question Status, Difficulty, Question Type (Traditional / Next Gen), Select Subject.
- **Quiz Report** confirmed matching `results.js` (Overall Performance score donut,
  Correct/Incorrect/Unanswered, Response Time = Your Average / Board Exam Average,
  by-subject table with green score bars).
- **Quiz/Review interface** (`take-quiz.js`) enhanced to match the real screen:
  added the blue **Review Mode** banner + **Back To Results**, the **Figure/Media**
  button, and the right **Question Feedback** panel (Question Feedback link, **QID**,
  "Rate the quality of this question" ★ rating, comment box, Submit). Already-present:
  Highlight/Strikeout/Calculator/Lab Values/Note/Mark tools, **Graded Response: Correct**,
  Correct Answer + explanation + References, **Peer Comparison** A/B/C/D % bars,
  Response Time, Difficulty level, Question List navigator.
- Captured the real **Loading…** spinner (stethoscope) as a reference for loading states.

**Learner-specific note:** institutional students see an **Organization Logo** banner at
the top of the dashboard (documented; the mock omits the image since the org-logo asset
isn't bundled). The learner dashboard is otherwise identical to the instructor dashboard
already built. Re-validated: 27/27 routes render clean; all JS pass `node --check`.

---

## Live-traversal corrections — Performance & Practice Exams (student login)
Traversed Performance dropdown → Performance by Subject + Performance Timeline, and the
Practice Exams modal. Reworked the mock to match the live screens:

- **Performance dropdown** relabeled to match real: **Performance Timeline** +
  **Performance by Subject** (Readiness/Risk kept as an extra mock-only entry).
- **Performance by Subject** (`performance.js`) rebuilt: **Quiz Types** filter (dropdown +
  removable chips), **Overall Performance** = Score donut + "X / Y Points" + Peer Rank
  percentile bell-curve, **Response Time** (Your Average / Board Exam Average), and the
  real subject table columns — Subject · **Questions Correct · Questions Partially Correct
  · Questions Incorrect · Questions Unanswered · Score · Points Possible · % Correct**.
  (Dropped the risk-category tabs/column — not on the real page.)
- **Performance Timeline** (`performance-timeline.js`) **rebuilt from a bar chart to the
  real chronological table**: "Includes results from all quiz modes except CAT", **My
  Quizzes / Assignments** toggle, columns Score badge · [mode] Name · Created · Questions
  Correct/Partially Correct/Incorrect/Unanswered · # of Q's · Review (+ NGN ? tooltip).
- **Practice Exams** nav button now opens the real **modal** ("Available Practice Exams /
  Which exam are you preparing for?" — radio list of exam templates + Cancel/**Continue**,
  Continue disabled until a selection). New data: `mock-data/practice-exams.json`.

All visually confirmed in-browser against staging. Re-validated: all JS pass `node --check`,
no global-scope collisions, all `DB.load()` resolve, **27/27 routes render clean**.
