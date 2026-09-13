import crypto from "crypto";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is required to seed demo data.");

const dbName = process.env.MONGODB_DB || "maha_innovate";
const id = () => crypto.randomUUID();
const now = new Date();
const client = new MongoClient(uri);

await client.connect();
const db = client.db(dbName);
const users = db.collection("users");
const problems = db.collection("problems");
const applications = db.collection("applications");
const trials = db.collection("trials");
const audit = db.collection("audit_events");

const officerEmail = process.env.DEMO_OFFICER_EMAIL || "officer.demo@maha-innovate.gov.in";
const startupEmail = process.env.DEMO_STARTUP_EMAIL || "startup.demo@ecovision.example";
const adminEmail = process.env.DEMO_ADMIN_EMAIL || "admin.demo@maha-innovate.gov.in";
const password = process.env.DEMO_PASSWORD || "DemoPass123!";

const officer = {
  id: id(), name: "Priya Deshmukh", email: officerEmail, role: "officer",
  department: "Pune Municipal Corporation", designation: "Innovation Program Officer",
  mobile: "+91 90000 00001", sector: "CivicTech", governmentId: "DEMO-OFFICER-001",
  passwordHash: await bcrypt.hash(password, 12), createdAt: now, updatedAt: now, isDemo: true
};
const startup = {
  id: id(), name: "Aakash Kulkarni", startupName: "EcoVision AI", email: startupEmail,
  role: "startup", sector: "CleanTech", location: "Pune", readiness: 88,
  completedPilots: 3, capabilities: "computer vision waste segregation civic operations analytics",
  experience: "municipal public sector deployment", solution: "AI waste classification and ward analytics",
  pilotBudget: 800000, dpiitId: "DEMO-DPIIT-001", mobile: "+91 90000 00002",
  passwordHash: await bcrypt.hash(password, 12), createdAt: now, updatedAt: now, isDemo: true
};

const admin = {
  id: id(), name: "MAHA-INNOVATE Administrator", email: adminEmail, role: "admin",
  department: "State Innovation Cell", designation: "Platform Administrator", mobile: "+91 90000 00003",
  passwordHash: await bcrypt.hash(password, 12), createdAt: now, updatedAt: now, isDemo: true
};
await users.deleteMany({ email: { $in: [officerEmail, startupEmail, adminEmail] } });
await users.insertMany([officer, startup, admin]);

const problem = {
  id: "MH-DEMO-PROB-001", title: "Improve urban waste segregation",
  description: "Increase segregation accuracy using computer vision and ward-level operational analytics.",
  department: "Pune Municipal Corporation", location: "Pune", sector: "CleanTech",
  requiredCapabilities: "waste segregation computer vision civic operations",
  budgetMin: 500000, budgetMax: 800000, expectedOutcome: "Reach at least 70% segregation efficiency.",
  status: "OPEN", createdBy: officer.id, createdAt: now, updatedAt: now, isDemo: true
};
await problems.deleteMany({ id: problem.id });
await problems.insertOne(problem);

const application = {
  id: "MH-DEMO-APP-001", problemId: problem.id, startupId: startup.id, officerId: officer.id,
  proposal: "Deploy computer vision classification and ward dashboards across a small trial.",
  capabilities: startup.capabilities, status: "TRIAL", createdAt: now, updatedAt: now, isDemo: true
};
await applications.deleteMany({ id: application.id });
await applications.insertOne(application);

const trial = {
  id: "MH-DEMO-TRIAL-001", applicationId: application.id, problemId: problem.id,
  startupId: startup.id, officerId: officer.id, location: "Pune · 4 wards",
  startDate: "2026-08-12", endDate: "2026-11-10", budget: 800000,
  scope: "Small-scale trial across four municipal wards.", evidenceIds: [],
  kpis: [
    { name: "Classification accuracy", target: 90, actual: 93, unit: "%", status: "MET", evidenceReference: "field-performance-report.pdf" },
    { name: "Processing time", target: 30, actual: 22, unit: "minutes", status: "MET", direction: "lower", evidenceReference: "field-performance-report.pdf" },
    { name: "Cost reduction", target: 15, actual: 19, unit: "%", status: "MET", evidenceReference: "kpi-evidence-pack.xlsx" }
  ],
  evaluation: { result: "SUCCESSFUL", met: 3, total: 3, evaluatedBy: officer.id, evaluatedAt: now, explanation: "Pilot met the defined success criteria." },
  status: "COMPLETED", createdAt: now, updatedAt: now, isDemo: true
};
await trials.deleteMany({ id: trial.id });
await trials.insertOne(trial);

await audit.insertMany([
  { id: id(), actor: officer.id, role: "officer", action: "DEMO_SEEDED", entityType: "trial", entityId: trial.id, timestamp: now, summary: "Illustrative Demo Data seeded for judge flow", metadata: { isDemo: true } },
  { id: id(), actor: "system", role: "system", action: "DEMO_SEEDED", entityType: "problem", entityId: problem.id, timestamp: now, summary: "Illustrative Demo Data seeded", metadata: { isDemo: true } }
]);

console.log(JSON.stringify({ ok: true, officerEmail, startupEmail, adminEmail, problemId: problem.id, trialId: trial.id }, null, 2));
await client.close();