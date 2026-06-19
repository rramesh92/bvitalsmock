# Remaining-Work Checklist (gap analysis vs. real product routes)

Derived from the real React Router route table in `services/bv/boardvitals/javascript/app`.
Legend: ✅ done · 🟡 partial · ⬜ to build this pass

## Already implemented (preserve)
✅ Login · ✅ Dashboard (real layout/tokens) · ✅ Question Banks (storefront cards) ·
✅ Create Quiz · ✅ Take Quiz · ✅ Quiz Results · ✅ My Quizzes (active/archived) ·
✅ Performance · ✅ Readiness/Risk · ✅ CME Center · ✅ Clinical Pearls · ✅ Account/Settings ·
✅ B2B Admin (Classes/Assignments/Class Reports) · ✅ UI States Demo ·
✅ Shared chrome: top navy header, sub-nav, qb switcher, notifications, toasts, modals, loading/empty/error.

## Built this pass (COMPLETE)
| Real route(s) | Screen | Status |
|---|---|---|
| `/search/...` | **Search / Browse Questions** (search bar, facets, results table, pagination, empty state) | ✅ `search.js` |
| `/student-purchase-options`, cart, checkout | **Cart + Checkout** (line items, totals, payment form w/ validation + disabled submit, empty-cart) | ✅ `cart.js`, `checkout.js` |
| `/performance-timeline` | **Performance Timeline** (time-series chart, All/Assignments toggle, totals, weekly table) | ✅ `performance-timeline.js` |
| `/practice-exam-performance/:quiz_id` | **Practice Exam Performance** (predicted-pass band, score donut, section/subject breakdown) | ✅ `practice-exam-performance.js` |
| `/no-subscriptions` | **No Subscriptions** (welcome/onboarding empty state + CTAs) | ✅ `no-subscriptions.js` |
| `/not-yet-verified` | **Not Yet Verified** (individual/institutional choice, resend link) | ✅ `not-yet-verified.js` |
| `/question-management(/create,/upload,/:id/edit)` | **Question Management** (table+pagination, create/edit form w/ validation, preview modal, CSV upload) | ✅ `question-management.js` |
| `/user-management`, `/upload-users(-confirmation)` | **User Management + Bulk Upload** (users table+pagination, add-user modal, CSV snapshot) | ✅ `user-management.js` |
| `/usage-reports(/:id/...)` | **Usage / Organization Reports** (reports list, detail panel, by-module table, export) | ✅ `usage-reports.js` |
| `/assignments/templates(...)` | Assignment Templates | 🟡 folded into B2B Assignments tab |
| `/classes/:id(/edit,/reports,...)` | Class detail / reports drill-in | 🟡 summarized in B2B Class Reports tab |
| `/select-priority-organization` | Select priority org | 🟡 documented gap (rare onboarding) |

## Shared components / states
| Item | Status |
|---|---|
| **Footer** (NavigationFooter: Support/Company/Resources/Mobile App + social, navy) | ✅ added to shell |
| Pagination (question-management, user-management, search) | ✅ |
| Form validation messages + disabled submit (checkout, question form, add-user) | ✅ |
| Active nav state for new routes (Admin + Performance dropdowns, Browse) | ✅ |
| Cart access (header cart icon + storefront) | ✅ |
| Edge-state pages reachable (user menu → No Subscriptions / Not Yet Verified) | ✅ |
| Confirmation dialogs (delete/archive/claim) | ✅ |

## Flow coverage vs. product doc (`ObsidianVaults/.../BoardVitals.md`)
| Doc flow | Status | Where |
|---|---|---|
| **B2C** (no-login: storefront → profession/plan → register → checkout → dashboard) | ✅ added | `storefront.js`, `product-page.js`, `register.js`, `cart.js`, `checkout.js` (public routes) |
| **B2B (Institutional)** | ✅ | `b2b.js` (Classes, class detail, Assignments) |
| **ATI integration** (iframe embed, NCLEX-PN/RN only, sharing disabled) | ✅ added (from doc) | `ati.js` |
| **LTI partner launch** | ✅ added (from doc) | `lti-launch.js` |
| **Quiz modes** (Test/CAT/Tutor/Study) | ✅ | `create-quiz.js`, `take-quiz.js` |
| **Question types** incl. **NGN** (dropdown cloze, matrix grid) | ✅ added interactive | `take-quiz.js` + `quiz.json` (ngn_type) |
| **In-quiz tools, CME, performance, search, admin reports** | ✅ | respective views |

## Out of scope (documented limitations)
- Board-exam interface emulations (PSI / FRED / Pearson VUE) — generic timed view only.
- NGN: dropdown-cloze + matrix are interactive; **bowtie / hotspot / drag-drop** still structural.
- Real auth (Devise login is an external Angular widget) — sign-in/register mocked.
- ATI & LTI screens are **built from the product doc's description** (no live access to those
  embeds), unlike the B2C/B2B/learner screens which were matched against staging.
- Live tool overlays (calculator, lab values, notes), PDF/CSV downloads — stubbed toasts.
