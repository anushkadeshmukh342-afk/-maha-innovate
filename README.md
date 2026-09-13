# GOV INNOVATE

GOV INNOVATE is a Maharashtra government-startup innovation procurement platform. It helps an authorized officer move from a public problem to startup matching, comparison, a small-scale trial, KPI evaluation, a traceable decision and future scale/replication.

The existing React interface and visual identity are intentionally preserved. This phase adds a MongoDB-backed workflow behind the approved screens.

## Architecture

- **Frontend:** React 18, Vite, JavaScript, custom CSS and lucide-react
- **Backend:** Node.js, Express
- **Database:** MongoDB via the native `mongodb` driver
- **Authentication:** bcrypt password hashing, JWT in an HTTP-only cookie, role middleware
- **Matching:** deterministic, explainable server-side scoring; a Python NLP service can be added later
- **Evidence:** authorized multipart uploads to Firebase Storage when configured, with safe metadata-only demo fallback
- **Email:** optional SMTP delivery through Nodemailer; in-app notifications do not depend on email
- **Deployment:** Render-compatible `npm run build` and `npm start`, listening on `0.0.0.0`

## Run locally

```bash
npm install
npm run build
PORT=5000 MONGODB_URI="mongodb://127.0.0.1:27017" SESSION_SECRET="replace-me" npm start
```

The public landing page can load without MongoDB. Authenticated workflow actions require a reachable MongoDB database.

## Environment variables

Required in production:

```env
PORT=5000
MONGODB_URI=mongodb+srv://...
MONGODB_DB=maha_innovate
SESSION_SECRET=long-random-secret
NODE_ENV=production
```

Optional:

```env
FIREBASE_STORAGE_BUCKET=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=
```

SMTP and Firebase are optional. When Firebase is configured, evidence files are uploaded server-side and MongoDB stores the `gs://` reference. When SMTP is configured, important workflow events also send email. The application continues to provide in-app notifications and safe demo evidence metadata when either service is unavailable. Secrets must only be provided through the deployment environment.

## MongoDB collections

The server creates indexes for and uses:

- `users`
- `problems`
- `applications`
- `matches`
- `trials`
- `evidence`
- `decisions`
- `notifications`
- `audit_events`
- `grievances`

## Main API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET|POST /api/problems`
- `PATCH /api/problems/:id`
- `POST /api/problems/:id/publish`
- `GET /api/problems/:id/matches`
- `GET|POST /api/applications`
- `PATCH /api/applications/:id/status`
- `POST /api/applications/:id/shortlist`
- `GET|POST /api/trials`
- `PATCH /api/trials/:id/kpis`
- `POST /api/trials/:id/evaluate`
- `GET|POST /api/decisions`
- `GET /api/notifications`
- `PATCH /api/notifications/read-all`
- `GET /api/scale/opportunities`
- `GET /api/startups/trust-passport`
- `GET /api/audit`
- `POST /api/evidence` — multipart field `file` plus `relatedTrial` or `relatedApplication`
- `GET /api/evidence/:id` — authorized metadata and short-lived download URL
- `GET|POST /api/grievances`
- `GET /api/admin/stats`

All protected routes validate the HTTP-only session, role and resource ownership on the server. Public registration only accepts `officer` and `startup`; admin access must be provisioned separately.

## Demo data

Demo data is never inserted on every server restart. To seed the illustrative judge flow explicitly:

```bash
MONGODB_URI="mongodb://127.0.0.1:27017" SESSION_SECRET="replace-me" npm run seed-demo
```

The seed creates:

- demo officer: `officer.demo@maha-innovate.gov.in`
- demo startup: `startup.demo@ecovision.example`
- password: `DemoPass123!`

Override those values with `DEMO_OFFICER_EMAIL`, `DEMO_STARTUP_EMAIL` and `DEMO_PASSWORD`. Seeded records are marked `isDemo: true` and the UI labels illustrative records clearly. They do not represent actual government procurement, department approval, infrastructure integration or startup performance.

## Judge flow

1. Register or sign in as a government officer.
2. Create and publish a problem.
3. Open Find Startups to calculate explainable matches.
4. A startup registers, sees open opportunities and applies.
5. The officer reviews and shortlists an application.
6. The officer creates a small-scale trial and stores KPIs.
7. The officer evaluates the trial; the server calculates the result.
8. The officer records one of four decisions:
   - Recommend Procurement
   - Extend Trial
   - Request More Evidence
   - Reject
9. Notifications and audit events are written to MongoDB.

## Limitations

- Firebase and SMTP are optional integrations; without their environment variables, the application intentionally uses safe demo evidence references and in-app notifications.
- The current approved UI still contains illustrative screens for some secondary admin analytics; those are clearly labelled and do not replace live workflow records.

## Controlled demo seed

Run `npm run seed-demo` only against the MongoDB database intended for the demonstration. It creates clearly marked `isDemo: true` officer, startup and administrator records plus an illustrative problem, application, completed trial and audit records. It does not seed automatically on server restart.

The seeded administrator is controlled by the seed command rather than public registration. The demo password is shared by the seeded demo accounts unless overridden with `DEMO_PASSWORD`.

## Live vs illustrative data

Authenticated screens use MongoDB records when available. The public/demo experience may fall back to clearly labelled illustrative examples when no account or database is available. Illustrative records are not claims of actual Maharashtra government contracts, results or integrations.
