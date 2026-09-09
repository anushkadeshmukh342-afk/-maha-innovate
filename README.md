# MAHA-INNOVATE demo

MAHA-INNOVATE is a polished, responsive demo of a Maharashtra Innovation Procurement Platform. It shows the connected journey:

**Identify → Match → Verify → Pilot → Evaluate → Procure → Scale → Replicate**

The app is intentionally seeded with clearly labelled sample/demo data so judges can explore the golden flow without creating 20 records.

## Run in VS Code

1. Open this folder in VS Code.
2. Make sure Node.js 18+ is installed.
3. Open a terminal and run:

```bash
npm install
npm run dev
```

4. Open the local URL printed by Vite.

For a production build:

```bash
npm run build
npm run preview
```

## Demo flow

- Start on the public landing page.
- Click **Open demo workspace**.
- Use the role selector in the top-right to switch between Government Officer, Startup and State Administrator.
- Officer: **AI Matches → Active Pilots → Procurement / Scale Opportunities**
- Officer: **AI Matches → Shortlisted Startups → Active Pilots → Procurement / Scale Opportunities**
- Startup: **Pilot Journey → Trust Passport → Profile → Notifications → Grievances**
- Administrator: **State Overview → Departments → Startups → Pilots → Procurement → Innovation Map → Policy Compliance → ROI & Impact → Grievances**

The expanded demo also includes:

- Startup comparison and structured fair-rejection guidance
- Government Innovation Profile with deployment history
- State department and startup directories
- State pilot portfolio with risk and KPI health
- Procurement pipeline from evidence-ready pilots to replication
- State grievance oversight with SLA indicators
- Notification centre and richer sample records

The “AI” recommendations and policy rules are deterministic demo services in this frontend. The UI keeps recommendations explainable and makes clear that eligibility and procurement decisions remain with authorized officers.