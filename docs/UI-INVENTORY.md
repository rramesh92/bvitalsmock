# BoardVitals — UI Inventory

> Reconstructed from the contracts present in this repo: `board-vitals-shared-js`
> (Redux actions/reducers/slices, selectors, logic hooks, route params, domain
> factories) and the `maestro-ui` mobile E2E flows. **No rendered front-end app
> exists in this repo** — the web/mobile apps live in separate repositories — so
> this inventory is *inferred from data + behavior contracts*, not copied from
> templates. See `NOTES.md` for the asset/visual-fidelity caveats.

## Product summary

BoardVitals is a **medical board-exam preparation + CME (Continuing Medical
Education) platform**. Learners pick a **question bank** (e.g. Internal Medicine,
Cardiology, Family Medicine, Dental), build and take **quizzes** in several modes,
review **performance analytics** vs. peers, earn and track **CME credits**, and
study **clinical pearls**. A **B2B / institutional** side lets admins manage
member groups, assignments, and class reports.

Evidence anchors:
- Route param `/search/:quiz_id?/:filter?/:question_number?` (`hooks/params.js`)
- Maestro element IDs: `new_quick_quiz_button_card_button`, `multiple_choice_option_0`,
  `next_question_button`, `grade_quiz_button`, `grade_quiz_modal_grade_quiz_button`,
  `quiz_results_cancel_button`, `DASHBOARD` (`maestro-ui/quizzes/quick_start_quiz_flow.yaml`)
- Domain factories: `Question`, `Quiz`, `Answer`, `Response`, `QuestionBank`,
  `User`, `Subscription*`, `CmeActivity`, `CmeCertificate`, `RiskAssessment`,
  `ClinicalPearl`, `MemberGroup`, `Assignment`, `ClassReport`, `Organization`

## User roles / tenants (drives role-based variation)

From `User` factory + B2B actions/reducers:
- **Learner (consumer)** — `user_type: 'consumer'`. Core test-taking experience.
- **Institutional learner** — belongs to an `Organization` via `OrganizationalMembership`; access via `OrganizationalSubscription`.
- **Admin / instructor (B2B)** — `internal_role`, owns `member_group_ids`; manages assignments, member groups, class reports.
- **Tutor mode** — `tutor_mode_enabled` changes the quiz-taking UX (immediate feedback after each question).
- **LTI** — launched from an LMS (`hooks/lti.js`, `ltiQuizFetchTake`) — embedded/standalone variation.

## Shared layout & chrome

| Element | Source signal |
|---|---|
| Top header (logo, question-bank switcher, user menu, notifications) | `session.selected_question_bank_id`, `Notifications` actions/reducer, `User` |
| Left sidebar nav (Dashboard, Create Quiz, My Quizzes, Performance, CME, Clinical Pearls, Account) | hook groups + Maestro `DASHBOARD` nav target |
| Question-bank context switcher | `selected_question_bank_id` in session; `whitelisted_question_bank_ids` on user |
| Notifications bell + dropdown | `notifications` reducer, `Notifications` actions |
| Toasts / alerts | `*_ERROR` / `*_CREATED` constants (e.g. `GENERAL_FEEDBACK_SUBMITTED`) |
| Modal system | `actions/modal.js`, `reducers/modal.js`, Maestro `grade_quiz_modal_*` |
| Loading states | `reducers/loading.js`, `useIsLoading`, `*_FETCHING` constants |
| Error states | `*_FETCH_ERROR` constants throughout |
| Empty states | list reducers default to empty Immutable Maps |

## Screens by product area

### A. Auth (pre-login)
| Screen | Notes |
|---|---|
| A1. Login | Maestro `ua-username` / `name@email.com`; `Session.sessionLogin` |
| A2. SSO / ATI / LTI launch | `sessionAtiLogin`, `sessionLoginLTI` (role variation) |
| A3. Logout confirmation | `logout_flow.yaml` |

### B. Learner home / dashboard
| Screen | Notes |
|---|---|
| B1. Dashboard | Quick-quiz card, recent quizzes, pass-likelihood, CME snapshot, board-exam countdown (`BoardExamDate`) |
| B2. Question-bank selection / switch | `QuestionBank` list, `productPages`, marketing blurb fields |

### C. Quiz creation
| Screen | Notes |
|---|---|
| C1. Quick Quiz (one-tap) | `quizzesQuickCreate`; Maestro `new_quick_quiz_button_card_button` |
| C2. Custom / Create Quiz | subject pickers, question count, modes (tutor/timed/adaptive), difficulty, `quizzesCreate` |
| C3. Adaptive / CAT quiz | `quizzesCreateCAT`, `adaptive_available` |
| C4. Practice Exam | `PracticeExamTemplate`, `quizzesCreatePractice`, board-exam interface (PSI/FRED/Pearson VUE) |

### D. Quiz taking
| Screen / state | Notes |
|---|---|
| D1. Question view (multiple choice) | `Question`, `Answer`, lead-in, images/videos/resources; `multiple_choice_option_*` |
| D2. Tutor-mode immediate feedback | `tutor_mode_enabled` — explanation after each answer |
| D3. Tools: highlight, strikethrough, mark, notes | `Highlight`, `StrikeThrough`, `Note` factories + actions |
| D4. Navigation (next/prev, question palette) | `next_question_button`, `question_ids`, `last_seen_question_number` |
| D5. Grade quiz modal | `grade_quiz_button` → `grade_quiz_modal_grade_quiz_button` |
| D6. Timed / board-exam interface | `seconds_remaining`, `board_exam_interface`, block/break pools |
| D7. NGN (Next-Gen NCLEX) item types | `is_ngn`, `ngnType`, `aact_relationships`, `dental_template` |

### E. Results & review
| Screen | Notes |
|---|---|
| E1. Quiz results summary | score, percentile, `num_answered_correctly`; `quiz_results_cancel_button` |
| E2. Per-question review (correct/incorrect + explanation) | `safe_explanation`, `correct_answer_ids`, peer response counts |
| E3. My Quizzes list (active/archived) | `quizzesFetch`, archive/unarchive actions |

### F. Performance / analytics
| Screen | Notes |
|---|---|
| F1. Performance overview | `selectPerformanceOverview`: pass-likelihood, peer rank/percentile, question status (correct/incorrect/unused), tutor toggle |
| F2. Performance by subject | `subject_performance`, `subjects` reducer |
| F3. Peer comparison | `performancePeers`, `performanceOrgPeers`, `b2bPeerCalc` |
| F4. Risk assessment / readiness | `RiskAssessment` factory, `riskCategoryHelper` |

### G. CME
| Screen | Notes |
|---|---|
| G1. CME tracker / dashboard | `CmeActivity`, `CmeCreditTracker`, `cme_hours`, credit types (AMA PRA Cat 1™, ANCC, MOC) |
| G2. Claim CME / activity flow | `cmeCalculate`, `minimum_percent_correct`, survey, board/license number |
| G3. Certificates | `CmeCertificate`, `cmeCertificateGenerate` |
| G4. Licenses & requirements | `CmeLicense`, `CmeLicenseRequirement` |
| G5. CME Coach | `cmeCoachSearch`, `cmeCoachSendEmail` |

### H. Clinical Pearls
| Screen | Notes |
|---|---|
| H1. Clinical Pearls library | `ClinicalPearl`, `has_clinical_pearls`, marked pearls |
| H2. Pearl detail | resources, images |

### I. Account / subscriptions
| Screen | Notes |
|---|---|
| I1. Account / profile | `User` (name, email, graduation_date, user_type) |
| I2. Subscriptions & plans | `ConsumerSubscription`, trial logic, activation date |
| I3. Billing / payment methods | `creditCards` slice |
| I4. Board exam date | `BoardExamDate` (drives countdown) |
| I5. Device registrations | `deviceRegistrations` (mobile) |

### J. B2B / institutional admin
| Screen | Notes |
|---|---|
| J1. Org dashboard | `Organization`, `StaffOrganization`, `organizationalSubscriptions` |
| J2. Member groups | `MemberGroup`, `MemberGroupMember`, paginated members |
| J3. Assignments | `Assignment`, create/update, assignment messages, assignment quizzes/responses |
| J4. Class reports | `ClassReport`, `Report`, member-group reports |
| J5. Exam templates | `ExamTemplate`, `PracticeExamTemplate` management |
| J6. Bulk user creation | `BULK_UPLOADING*`, `FETCH_BULK_USER_CREATION_SNAPSHOT*` |

## UI state matrix (apply to every list/detail screen)

- **Loading** — skeleton / spinner (`*_FETCHING`)
- **Loaded** — populated from mock JSON
- **Empty** — zero-result message + CTA
- **Error** — error banner + retry (`*_FETCH_ERROR`)
- **Offline** — `offline` action group, `HIGHLIGHT_SYNC_OFFLINE` (mobile)
