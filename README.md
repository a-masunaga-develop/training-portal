Release History

v0.4.0
2026-11-24

Features
- AI test generation: transcript / course text -> learning points -> 4-choice questions -> review, edit, register (or regenerate)
- AI learning analysis & recommendations: understanding per content, recent weak points, recommended next content
- AI admin report: student status counts (computed), common issues, students needing follow-up, suggested actions
- AI settings: status, model, monthly usage and cost estimate, execution history
- Dashboard "AI learning support" card; Admin "AI" tab

Infrastructure
- Claude API (claude-opus-5-5) called directly from Next.js route handlers, structured outputs, server-side fallback
- API key stored in SSM Parameter Store (SecureString), read by the Amplify compute role
- New DynamoDB tables: ai_generation_jobs / recommendations; contents.transcript
- Question generation split into 3-question calls to stay within the ~30s response limit

v0.3.0
2026-11-24

Features
- Content-based learning flow (learn -> test -> pass -> complete -> next)
- Sequential unlock (next content opens after the previous one is completed)
- Content types: text / video (YouTube embed) / external / pdf / assignment / exam
- Per-content comprehension tests with pass score and attempt history
- Dashboard: in progress, next content, recently completed, progress rate, latest test result
- Admin: Phase management, content & test management, student progress

Infrastructure
- New DynamoDB tables: phases / contents / content_progress
- Seed script can target specific tables
- IAM policies updated for the new tables (compute role, develop user)

v0.2.0
2026-11-24

Features
- Login (Cognito, email + password)
- First-login password setup
- Logout
- Password change
- Role-based access (admin / student)
- Admin page restricted to admin (403 for student)
- Per-user data (reports, test results, progress)

Infrastructure
- Cognito User Pool
- Next.js Middleware auth guard
- Amplify compute role scoped to the 5 tables

v0.1.0
2026-11-21

Features
- Dashboard
- Phase1
- Test
- Report
- Admin

Infrastructure
- Amplify
- DynamoDB
