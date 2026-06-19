# Staging Access (non-production)

> Non-production test environment. Credentials kept here intentionally (per owner) for
> re-running flow comparisons against the mock. **Do not reuse these for production.**

## Site
- App: https://stg-bv.ascendlearning.com
- Sign in: https://stg-bv.ascendlearning.com/users/sign_in
- Sign out: https://stg-bv.ascendlearning.com/users/sign_out

## Accounts
| Role / flow | Email | Password | Notes |
|---|---|---|---|
| **Instructor / Institutional admin** | `instructor@medcollege.com` | `Welcome@123` | Org: **Test Medical College**. Admin menu = Classes + Assignments. User label: TESTINSTRUCTOR1. |
| **Student / Learner** | `abhishek.bhushan@ascendlearning.com` | `Welcome@123` | Institutional student (sees Organization Logo banner on dashboard). User label: ABHISHEK. |

## Login steps (browser automation)
1. Go to `/users/sign_in`. The form is a custom widget — two unlabeled required textboxes (email, password) + a **LOGIN** button.
2. Fill email + password, click **LOGIN**. A post-login "Edit Profile" overlay may appear; the dashboard is at `/dashboard`.
3. To switch accounts: navigate to `/users/sign_out` first, then `/users/sign_in`.

## Key routes traversed (real React app)
- Learner: `/dashboard`, `/dashboard/quizzes/new` (Create Quiz), `/dashboard/quizzes/:id/report` (Quiz Report), `/dashboard/quizzes/:id/questions/:n` (Review interface), `/dashboard/clinical-pearls`, `/dashboard/my-cme`
- Institutional admin: `/dashboard/classes`, `/dashboard/classes/:id` (class detail / students), `/dashboard/assignments`
- Header context: learner = "Question Bank" switcher; admin = "Organization" switcher

## Notes
- These creds were used only in the live browser session for visual comparison; they now
  live here at the owner's request. Consider rotating after the project if desired.
- The mock UI (this directory) replicates these screens with static JSON — no login needed
  to review the mock (`python3 -m http.server 8080`).
