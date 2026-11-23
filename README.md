Release History

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
