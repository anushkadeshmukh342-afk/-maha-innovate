import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { MongoClient, ObjectId } from "mongodb";
import multer from "multer";
import nodemailer from "nodemailer";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 5050);
const SESSION_SECRET = process.env.SESSION_SECRET || (process.env.NODE_ENV === "production" ? null : "maha-local-development-secret");
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "maha_innovate";
const MAX_EVIDENCE_BYTES = Number(process.env.MAX_EVIDENCE_BYTES || 10 * 1024 * 1024);
let client;
let db;
let dbError = null;
let firebaseBucket = null;
let emailTransport = null;
let emailConfigLogged = false;
const authAttempts = new Map();

const collections = [
  "users", "problems", "applications", "matches", "trials", "evidence",
  "decisions", "notifications", "audit_events", "grievances"
];

const now = () => new Date();
const id = () => crypto.randomUUID();
const oid = (value) => ObjectId.isValid(value) ? new ObjectId(value) : null;
const safe = (value) => value instanceof ObjectId ? value.toString() : value;
const serialize = (value) => JSON.parse(JSON.stringify(value, (_, item) => safe(item)));
const publicUser = (user) => ({
  id: user.id, name: user.name, email: user.email, role: user.role,
  startupName: user.startupName, department: user.department, designation: user.designation,
  sector: user.sector, mobile: user.mobile, governmentId: user.governmentId, website: user.website, profile: user.profile
});

function initializeOptionalServices() {
  const firebaseReady = process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_STORAGE_BUCKET;
  if (firebaseReady) {
    try {
      const app = getApps()[0] || initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
      firebaseBucket = getStorage(app).bucket();
    } catch (error) {
      console.error("Firebase Storage is unavailable; using safe demo evidence mode.");
    }
  }
  if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.EMAIL_FROM) {
    emailTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD || ""
      } : undefined
    });
  }
}

const evidenceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_EVIDENCE_BYTES },
  fileFilter: (req, file, callback) => {
    const allowed = file.mimetype === "application/pdf" ||
      file.mimetype.startsWith("image/") ||
      ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.mimetype);
    callback(allowed ? null : new Error("Only PDF, image and report files are supported."), allowed);
  }
});

async function connectDatabase(attempt = 1) {
  if (!MONGODB_URI) {
    dbError = "MONGODB_URI is not configured. Set the MONGODB_URI environment variable.";
    console.error("[DB] MONGODB_URI not set — database unavailable.");
    return;
  }
  try {
    // Close any stale client before reconnecting
    if (client) {
      try { await client.close(true); } catch (_) { /* ignore */ }
      client = null;
      db = null;
    }

    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      // Explicit TLS settings for Node 22 / OpenSSL 3 compatibility
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
    });

    await client.connect();
    db = client.db(DB_NAME);

    // Verify the connection is truly live
    await db.command({ ping: 1 });

    await Promise.all([
      db.collection("users").createIndex({ email: 1 }, { unique: true }),
      db.collection("problems").createIndex({ status: 1, department: 1 }),
      db.collection("applications").createIndex({ problemId: 1, startupId: 1 }, { unique: true }),
      db.collection("notifications").createIndex({ recipient: 1, read: 1 }),
      db.collection("audit_events").createIndex({ timestamp: -1 })
    ]);

    dbError = null;
    console.log(`[DB] Connected to MongoDB Atlas (attempt ${attempt}).`);

    // Listen for topology events so we know if the connection drops later
    client.on("close", () => {
      db = null;
      dbError = "Database connection lost. Reconnecting…";
      console.warn("[DB] Connection closed — scheduling reconnect.");
      scheduleReconnect();
    });
    client.on("error", (err) => {
      console.error("[DB] MongoClient error:", err.message);
    });

  } catch (error) {
    db = null;
    const msg = error.message || "";
    if (msg.includes("SSL") || msg.includes("TLS") || msg.includes("tls") || msg.includes("ssl") || msg.includes("alert")) {
      dbError = "Database TLS/SSL error — your server IP may not be whitelisted in MongoDB Atlas. " +
        "Go to Atlas → Network Access → Add IP Address and add your current IP.";
      console.error(
        "[DB] TLS/SSL connection rejected by Atlas. Most likely cause: your IP is NOT in the Atlas IP allowlist.\n" +
        "     Current server IP: check https://api.ipify.org\n" +
        "     Fix: MongoDB Atlas → Network Access → Add IP Address → add your IP (or 0.0.0.0/0 for dev).\n" +
        "     Error:", msg.substring(0, 200)
      );
    } else if (msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND") || msg.includes("timeout")) {
      dbError = "Database unreachable — check MONGODB_URI and network connectivity.";
      console.error("[DB] Connection failed (network):", msg.substring(0, 200));
    } else {
      dbError = "Database connection unavailable.";
      console.error("[DB] Connection failed:", msg.substring(0, 200));
    }
    // Schedule automatic reconnect (backs off: 10s, 20s, 40s … up to 5 min)
    scheduleReconnect(attempt);
  }
}

let reconnectTimer = null;
function scheduleReconnect(attempt = 1) {
  if (reconnectTimer) return; // already scheduled
  const delay = Math.min(10000 * attempt, 300000); // 10s → 300s cap
  console.log(`[DB] Will retry connection in ${delay / 1000}s (attempt ${attempt + 1})…`);
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    await connectDatabase(attempt + 1);
  }, delay);
}

const collection = (name) => db?.collection(name);
const requireDb = (req, res, next) => {
  if (!db) return res.status(503).json({ error: "The platform data store is not available. Configure MongoDB and try again." });
  next();
};

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || "").split(";").filter(Boolean).map((part) => {
    const index = part.indexOf("=");
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }));
}

function readSession(req) {
  if (!SESSION_SECRET) return null;
  const token = parseCookies(req).maha_session;
  if (!token) return null;
  try {
    return jwt.verify(token, SESSION_SECRET);
  } catch {
    return null;
  }
}

async function currentUser(req) {
  const session = readSession(req);
  if (!session || !collection("users")) return null;
  return collection("users").findOne({ id: session.sub });
}

const requireAuth = async (req, res, next) => {
  const user = await currentUser(req);
  if (!user) return res.status(401).json({ error: "Authentication required." });
  req.user = user;
  next();
};

const allow = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Your account does not have access to this area." });
  next();
};

const validateCommon = (body) => {
  if (!body.email || !body.password || body.password.length < 8) return "Use a valid email and a password with at least 8 characters.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return "Use a valid email address.";
  return null;
};

const rateLimitAuth = (req, res, next) => {
  const key = `${req.ip}:${req.path}`;
  const recent = authAttempts.get(key) || [];
  const valid = recent.filter((timestamp) => Date.now() - timestamp < 10 * 60 * 1000);
  if (valid.length >= 20) return res.status(429).json({ error: "Too many attempts. Please try again later." });
  valid.push(Date.now());
  authAttempts.set(key, valid);
  next();
};

function setSession(res, user) {
  const token = jwt.sign({ sub: user.id, role: user.role }, SESSION_SECRET, { expiresIn: "8h" });
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `maha_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Max-Age=${8 * 60 * 60}; Path=/${secure}`);
}

async function audit(actor, action, entityType, entityId, summary, metadata = {}) {
  if (!collection("audit_events")) return;
  await collection("audit_events").insertOne({
    id: id(), actor: actor?.id || "system", role: actor?.role || "system",
    action, entityType, entityId: String(entityId || ""), timestamp: now(), summary, metadata
  });
}

async function notify(recipient, role, title, message, type, relatedEntity = {}) {
  if (!collection("notifications") || !recipient) return;
  await collection("notifications").insertOne({
    id: id(), recipient, role, title, message, type, relatedEntity, read: false, createdAt: now()
  });
  const user = await collection("users").findOne({ id: recipient }, { projection: { email: 1, name: 1 } });
  if (!user?.email) return;
  if (!emailTransport) {
    if (!emailConfigLogged) { console.warn("SMTP is not configured; notifications are stored in-app but cannot be delivered by email yet."); emailConfigLogged = true; }
    return;
  }
  if (!user?.email) return;
  try {
    await emailTransport.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: `GOV INNOVATE: ${title}`,
      text: `Hello ${user.name || "there"},\n\n${message}\n\nSign in to GOV INNOVATE to review this update.`
    });
  } catch (error) {
    if (!emailConfigLogged) {
      console.error("SMTP delivery failed; in-app notifications remain active.");
      emailConfigLogged = true;
    }
  }
}

async function canAccessRelatedRecord(user, relatedTrial, relatedApplication) {
  if (relatedTrial) {
    const trial = await collection("trials").findOne({ id: relatedTrial });
    if (!trial) return false;
    return user.role === "admin" || trial.startupId === user.id || trial.officerId === user.id;
  }
  if (relatedApplication) {
    const application = await collection("applications").findOne({ id: relatedApplication });
    if (!application) return false;
    return user.role === "admin" || application.startupId === user.id || application.officerId === user.id;
  }
  return user.role === "admin" || user.role === "officer" || user.role === "startup";
}

function normalizeWords(value) {
  return String(value || "").toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2);
}

function scoreMatch(problem, startup, previousPilots = 0) {
  const problemWords = new Set([
    ...normalizeWords(problem.title), ...normalizeWords(problem.description),
    ...normalizeWords(problem.sector), ...normalizeWords(problem.requiredCapabilities)
  ]);
  const startupWords = new Set([
    ...normalizeWords(startup.sector), ...normalizeWords(startup.capabilities),
    ...normalizeWords(startup.experience), ...normalizeWords(startup.solution)
  ]);
  const overlap = [...problemWords].filter((word) => startupWords.has(word)).length;
  const capabilityScore = Math.min(100, 45 + overlap * 12);
  const sectorScore = String(problem.sector || "").toLowerCase() === String(startup.sector || "").toLowerCase() ? 100 : 45;
  const readinessScore = Math.min(100, Number(startup.readiness || 65) + (previousPilots > 0 ? 5 : 0));
  const experienceScore = Math.min(100, 45 + Number(startup.completedPilots || previousPilots || 0) * 15);
  const budgetScore = problem.budgetMax && startup.pilotBudget
    ? (Number(startup.pilotBudget) <= Number(problem.budgetMax) ? 100 : 55)
    : 75;
  const locationScore = problem.location && startup.location
    ? (String(problem.location).toLowerCase() === String(startup.location).toLowerCase() ? 100 : 72)
    : 70;
  const overallScore = Math.round(
    sectorScore * .2 + capabilityScore * .25 + readinessScore * .15 +
    experienceScore * .15 + budgetScore * .15 + locationScore * .1
  );
  const reasons = [];
  if (sectorScore >= 90) reasons.push("Strong sector match");
  if (capabilityScore >= 70) reasons.push("Strong capability match");
  if (experienceScore >= 75) reasons.push("Relevant public-sector experience");
  if (budgetScore >= 90) reasons.push("Budget fits the stated range");
  if (readinessScore >= 75) reasons.push("Startup readiness aligns with pilot requirements");
  return { overallScore, sectorScore, capabilityScore, readinessScore, experienceScore, budgetScore, locationScore, reasons };
}

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "dist")));

app.get("/api/health", (req, res) => res.json({
  ok: true,
  database: db ? "connected" : "unavailable",
  error: dbError || null,
  hint: (!db && dbError && (dbError.includes("TLS") || dbError.includes("SSL")))
    ? "Your server IP is likely not whitelisted in MongoDB Atlas. Go to Atlas → Network Access → Add IP Address."
    : undefined,
  node: process.version,
  openssl: process.versions.openssl
}));

app.get("/api/email/health", requireAuth, async (req, res) => {
  if (!emailTransport) {
    return res.json({ configured: false, message: "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD and EMAIL_FROM in your environment to enable email delivery." });
  }
  try {
    await emailTransport.verify();
    res.json({ configured: true, message: "SMTP connection is healthy." });
  } catch (error) {
    res.json({ configured: true, healthy: false, message: "SMTP configured but connection test failed. Check your credentials." });
  }
});

app.post("/api/auth/register", requireDb, rateLimitAuth, async (req, res) => {
  const body = req.body || {};
  const commonError = validateCommon(body);
  if (commonError) return res.status(400).json({ error: commonError });
  if (!["officer", "startup", "admin"].includes(body.role)) return res.status(400).json({ error: "Choose Government Officer, Startup or State Administrator." });
  const email = body.email.trim().toLowerCase();
  if (await collection("users").findOne({ email })) return res.status(409).json({ error: "An account with this email already exists." });
  const required = body.role === "startup"
    ? [body.name, body.startupName, body.mobile, body.dpiitId, body.sector]
    : [body.name, body.mobile, body.department, body.designation, body.governmentId];
  if (required.some((value) => !String(value || "").trim())) return res.status(400).json({ error: "Complete all required registration fields." });
  const user = {
    id: id(), name: body.name.trim(), email, role: body.role, startupName: body.startupName?.trim(),
    department: body.department?.trim(), designation: body.designation?.trim(), sector: body.sector?.trim(),
    mobile: body.mobile.trim(), profile: { ...body, password: undefined, confirmPassword: undefined },
    passwordHash: await bcrypt.hash(body.password, 12), createdAt: now(), updatedAt: now()
  };
  await collection("users").insertOne(user);
  await audit(user, "REGISTRATION", "user", user.id, `${user.role} account registered`);
  await notify(user.id, user.role, "Welcome to GOV INNOVATE", "Your account is ready. You will receive workflow notifications at the email address registered on this account.", "account");
  setSession(res, user);
  res.status(201).json({ user: publicUser(user) });
});

app.post("/api/auth/login", requireDb, rateLimitAuth, async (req, res) => {
  const body = req.body || {};
  const commonError = validateCommon(body);
  if (commonError) return res.status(400).json({ error: commonError });
  const user = await collection("users").findOne({ email: body.email.trim().toLowerCase() });
  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) return res.status(401).json({ error: "Email or password is incorrect." });
  await audit(user, "LOGIN", "user", user.id, "User signed in");
  setSession(res, user);
  res.json({ user: publicUser(user) });
});

app.get("/api/auth/me", requireDb, async (req, res) => {
  const user = await currentUser(req);
  if (!user) return res.status(401).json({ error: "Not signed in." });
  res.json({ user: publicUser(user) });
});

app.patch("/api/auth/me", requireDb, requireAuth, async (req, res) => {
  const allowed = ["name", "mobile", "department", "designation", "governmentId", "startupName", "sector", "website"];
  const updates = {};
  for (const key of allowed) if (req.body?.[key] !== undefined) updates[key] = String(req.body[key] || "").trim();
  updates.updatedAt = now();
  await collection("users").updateOne({ id: req.user.id }, { $set: updates, $setOnInsert: {} });
  const updated = await collection("users").findOne({ id: req.user.id });
  await audit(updated, "PROFILE_UPDATED", "user", updated.id, "Profile details updated");
  res.json({ user: publicUser(updated) });
});

app.post("/api/auth/logout", (req, res) => {
  res.setHeader("Set-Cookie", "maha_session=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/");
  res.status(204).end();
});

app.get("/api/problems", requireDb, requireAuth, async (req, res) => {
  const filter = req.user.role === "officer" ? { createdBy: req.user.id } : { status: { $in: ["OPEN", "MATCHING", "SHORTLISTED", "TRIAL"] } };
  const items = await collection("problems").find(filter).sort({ createdAt: -1 }).limit(100).toArray();
  res.json({ problems: serialize(items) });
});

app.post("/api/problems", requireDb, requireAuth, allow("officer"), async (req, res) => {
  const body = req.body || {};
  if (!body.title || !body.description || !body.department || !body.sector) return res.status(400).json({ error: "Title, description, department and sector are required." });
  const problem = {
    id: id(), title: body.title.trim(), description: body.description.trim(), department: body.department.trim(),
    location: body.location?.trim() || "", sector: body.sector.trim(), requiredCapabilities: body.requiredCapabilities || "",
    budgetMin: Number(body.budgetMin || 0), budgetMax: Number(body.budgetMax || 0),
    expectedOutcome: body.expectedOutcome || "", status: "OPEN", createdBy: req.user.id,
    createdAt: now(), updatedAt: now(), isDemo: false
  };
  await collection("problems").insertOne(problem);
  await audit(req.user, "PROBLEM_CREATED", "problem", problem.id, `Problem created: ${problem.title}`);

  // Notify all registered startup users about the new problem
  let emailsSent = 0;
  let emailError = null;
  try {
    const startups = await collection("users").find({ role: "startup" }).toArray();
    const budgetLabel = problem.budgetMax ? `₹${Number(problem.budgetMax).toLocaleString("en-IN")}` : "To be defined";
    for (const startup of startups) {
      const recipientName = startup.startupName || startup.name || "Startup";
      const inAppMessage = `A new government challenge has been posted: "${problem.title}" by ${problem.department}. Sector: ${problem.sector}. Budget: ${budgetLabel}. Log in to apply.`;
      // In-app notification (always stored)
      await collection("notifications").insertOne({
        id: id(), recipient: startup.id, role: "startup",
        title: "New Government Opportunity on GovInnovate",
        message: inAppMessage, type: "opportunity",
        relatedEntity: { problemId: problem.id, page: "Opportunities" },
        read: false, createdAt: now()
      });
      // Email notification (only if transporter is configured)
      if (emailTransport && startup.email) {
        try {
          await emailTransport.sendMail({
            from: process.env.EMAIL_FROM,
            to: startup.email,
            subject: "New Government Opportunity on GovInnovate",
            text: [
              `Hello ${recipientName},`,
              "",
              "A new government challenge has been posted on GovInnovate.",
              "",
              `Problem: ${problem.title}`,
              `Department: ${problem.department}`,
              `Sector: ${problem.sector}`,
              `Location: ${problem.location || "Maharashtra"}`,
              `Budget: ${budgetLabel}`,
              `Application/Problem ID: ${problem.id}`,
              "",
              "Please log in to GovInnovate to view the complete challenge and apply.",
              "",
              "Regards,",
              "GovInnovate Maharashtra"
            ].join("\n")
          });
          emailsSent++;
        } catch (mailErr) {
          emailError = mailErr.message;
          console.error(`Email to startup ${startup.id} failed:`, mailErr.message);
        }
      }
    }
  } catch (notifyErr) {
    console.error("Startup notification loop failed:", notifyErr.message);
    emailError = notifyErr.message;
  }

  const responseMessage = emailTransport
    ? (emailError
      ? "Problem posted successfully, but some email notifications could not be sent."
      : `Problem posted successfully. ${emailsSent} startup(s) have been notified by email.`)
    : "Problem posted successfully. In-app notifications sent to startups. Configure SMTP to enable email delivery.";

  res.status(201).json({ problem: serialize(problem), message: responseMessage, emailsSent });
});

app.patch("/api/problems/:id", requireDb, requireAuth, allow("officer"), async (req, res) => {
  const problem = await collection("problems").findOne({ id: req.params.id });
  if (!problem || problem.createdBy !== req.user.id) return res.status(404).json({ error: "Problem not found." });
  const updates = Object.fromEntries(["title", "description", "department", "location", "sector", "requiredCapabilities", "budgetMin", "budgetMax", "expectedOutcome", "status"].filter((key) => req.body[key] !== undefined).map((key) => [key, req.body[key]]));
  updates.updatedAt = now();
  await collection("problems").updateOne({ id: problem.id }, { $set: updates });
  res.json({ problem: serialize({ ...problem, ...updates }) });
});

app.post("/api/problems/:id/publish", requireDb, requireAuth, allow("officer"), async (req, res) => {
  const result = await collection("problems").updateOne({ id: req.params.id, createdBy: req.user.id }, { $set: { status: "OPEN", updatedAt: now() } });
  if (!result.matchedCount) return res.status(404).json({ error: "Problem not found." });
  await audit(req.user, "PROBLEM_PUBLISHED", "problem", req.params.id, "Problem published for startup applications");
  res.json({ ok: true });
});

app.get("/api/problems/:id/matches", requireDb, requireAuth, async (req, res) => {
  const problem = await collection("problems").findOne({ id: req.params.id });
  if (!problem) return res.status(404).json({ error: "Problem not found." });
  const startups = await collection("users").find({ role: "startup" }).toArray();
  const results = [];
  for (const startup of startups) {
    const previousPilots = await collection("trials").countDocuments({ startupId: startup.id, status: "COMPLETED" });
    const score = scoreMatch(problem, startup, previousPilots);
    const match = { id: id(), problemId: problem.id, startupId: startup.id, ...score, reasons: score.reasons, createdAt: now() };
    await collection("matches").updateOne({ problemId: problem.id, startupId: startup.id }, { $set: match }, { upsert: true });
    results.push({ ...match, startup: publicUser(startup) });
  }
  results.sort((a, b) => b.overallScore - a.overallScore);
  res.json({ matches: serialize(results) });
});

app.get("/api/applications", requireDb, requireAuth, async (req, res) => {
  const filter = req.user.role === "startup" ? { startupId: req.user.id } : { officerId: req.user.id };
  const items = await collection("applications").find(filter).sort({ createdAt: -1 }).toArray();
  const enriched = await Promise.all(items.map(async application => {
    const [problem, startup, match] = await Promise.all([
      collection("problems").findOne({ id: application.problemId }),
      collection("users").findOne({ id: application.startupId }),
      collection("matches").findOne({ problemId: application.problemId, startupId: application.startupId })
    ]);
    return { ...application, problemTitle: problem?.title || "Government problem", department: problem?.department || "Department", location: problem?.location || "", startupName: startup?.startupName || startup?.name || "Registered startup", matchScore: match?.overallScore ?? null };
  }));
  res.json({ applications: serialize(enriched) });
});

app.post("/api/applications", requireDb, requireAuth, allow("startup"), async (req, res) => {
  const { problemId, proposal, capabilities } = req.body || {};
  const problem = await collection("problems").findOne({ id: problemId });
  if (!problem || !["OPEN", "MATCHING"].includes(problem.status)) return res.status(400).json({ error: "This opportunity is not open for applications." });
  const existing = await collection("applications").findOne({ problemId, startupId: req.user.id });
  if (existing) return res.status(409).json({ error: "You have already applied to this opportunity." });
  const application = { id: id(), problemId, startupId: req.user.id, officerId: problem.createdBy, proposal: proposal || "", capabilities: capabilities || "", status: "APPLIED", createdAt: now(), updatedAt: now(), isDemo: false };
  await collection("applications").insertOne(application);

  // In-app notification to officer
  await notify(problem.createdBy, "officer", "New startup application",
    `${req.user.startupName || req.user.name} applied to "${problem.title}". Application ID: ${application.id}.`,
    "application", { applicationId: application.id, problemId, page: "Compare & Shortlist" }
  );

  // Rich email to the government officer
  if (emailTransport && problem.createdBy) {
    try {
      const officer = await collection("users").findOne({ id: problem.createdBy });
      if (officer?.email) {
        await emailTransport.sendMail({
          from: process.env.EMAIL_FROM,
          to: officer.email,
          subject: "New Startup Solution Submitted on GovInnovate",
          text: [
            `Hello ${officer.name || "Government Officer"},`,
            "",
            "A startup has submitted a solution for your government challenge.",
            "",
            `Startup: ${req.user.startupName || req.user.name}`,
            `Problem: ${problem.title}`,
            `Application ID: ${application.id}`,
            `Sector: ${problem.sector}`,
            "",
            "Please log in to GovInnovate to review the submission.",
            "",
            "Regards,",
            "GovInnovate Maharashtra"
          ].join("\n")
        });
      }
    } catch (mailErr) {
      console.error("Officer application email failed:", mailErr.message);
    }
  }

  await audit(req.user, "APPLICATION_SUBMITTED", "application", application.id, `Application submitted for ${problem.title}`);
  res.status(201).json({ application: serialize(application) });
});

app.patch("/api/applications/:id/status", requireDb, requireAuth, allow("officer"), async (req, res) => {
  const application = await collection("applications").findOne({ id: req.params.id, officerId: req.user.id });
  if (!application) return res.status(404).json({ error: "Application not found." });
  const allowed = ["UNDER_REVIEW", "SHORTLISTED", "TRIAL", "COMPLETED", "SELECTED", "REJECTED", "MORE_EVIDENCE_REQUESTED"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ error: "Invalid application status." });
  await collection("applications").updateOne({ id: application.id }, { $set: { status: req.body.status, updatedAt: now() } });
  const startup = await collection("users").findOne({ id: application.startupId });
  const statusLabel = req.body.status.replaceAll("_", " ").toLowerCase();
  const statusTitle = req.body.status === "MORE_EVIDENCE_REQUESTED" ? "Evidence requested" : req.body.status === "SHORTLISTED" ? "Application shortlisted" : "Application status changed";
  await notify(application.startupId, "startup", statusTitle, `Your application is now ${statusLabel}.`, "application", { applicationId: application.id });
  await audit(req.user, req.body.status === "SHORTLISTED" ? "STARTUP_SHORTLISTED" : "APPLICATION_STATUS_CHANGED", "application", application.id, `Application status changed to ${req.body.status}`);
  res.json({ ok: true, startup: startup ? publicUser(startup) : null });
});

app.post("/api/applications/:id/shortlist", requireDb, requireAuth, allow("officer"), async (req, res) => {
  req.body.status = "SHORTLISTED";
  const application = await collection("applications").findOne({ id: req.params.id, officerId: req.user.id });
  if (!application) return res.status(404).json({ error: "Application not found." });
  await collection("applications").updateOne({ id: application.id }, { $set: { status: "SHORTLISTED", updatedAt: now() } });
  await notify(application.startupId, "startup", "You were shortlisted", "Your application moved to the shortlist for officer review.", "shortlist", { applicationId: application.id });
  await audit(req.user, "STARTUP_SHORTLISTED", "application", application.id, "Startup shortlisted for trial consideration");
  res.json({ ok: true });
});

app.get("/api/trials", requireDb, requireAuth, async (req, res) => {
  const filter = req.user.role === "startup" ? { startupId: req.user.id } : { officerId: req.user.id };
  const items = await collection("trials").find(filter).sort({ createdAt: -1 }).toArray();
  const enriched = await Promise.all(items.map(async trial => {
    const [problem, startup] = await Promise.all([collection("problems").findOne({ id: trial.problemId }), collection("users").findOne({ id: trial.startupId })]);
    return { ...trial, problemTitle: problem?.title || "Government problem", department: problem?.department || "Department", startupName: startup?.startupName || startup?.name || "Registered startup" };
  }));
  res.json({ trials: serialize(enriched) });
});

app.post("/api/trials", requireDb, requireAuth, allow("officer"), async (req, res) => {
  const { applicationId, location, startDate, endDate, budget, scope, kpis = [] } = req.body || {};
  const application = await collection("applications").findOne({ id: applicationId, officerId: req.user.id, status: { $in: ["SHORTLISTED", "SELECTED"] } });
  if (!application) return res.status(400).json({ error: "Only shortlisted applications can start a trial." });
  const trial = { id: id(), applicationId, problemId: application.problemId, startupId: application.startupId, officerId: req.user.id, location: location || "", startDate, endDate, budget: Number(budget || 0), scope: scope || "", kpis: kpis.map((kpi) => ({ ...kpi, status: "PENDING" })), evidenceIds: [], evaluation: null, status: "ACTIVE", createdAt: now(), updatedAt: now(), isDemo: false };
  await collection("trials").insertOne(trial);
  await collection("applications").updateOne({ id: application.id }, { $set: { status: "TRIAL", updatedAt: now() } });
  await notify(application.startupId, "startup", "Trial started", "Your application has moved into a small-scale trial.", "trial", { trialId: trial.id });
  await audit(req.user, "TRIAL_CREATED", "trial", trial.id, "Small-scale trial created");
  res.status(201).json({ trial: serialize(trial) });
});

app.patch("/api/trials/:id/kpis", requireDb, requireAuth, allow("officer"), async (req, res) => {
  const trial = await collection("trials").findOne({ id: req.params.id, officerId: req.user.id });
  if (!trial) return res.status(404).json({ error: "Trial not found." });
  const kpis = (req.body.kpis || []).map((kpi) => {
    const target = Number(kpi.target);
    const actual = Number(kpi.actual);
    const met = kpi.direction === "lower" ? actual <= target : actual >= target;
    return { name: kpi.name, target, actual, unit: kpi.unit || "", status: met ? "MET" : "NOT_MET", evidenceReference: kpi.evidenceReference || "" };
  });
  await collection("trials").updateOne({ id: trial.id }, { $set: { kpis, updatedAt: now() } });
  await audit(req.user, "KPI_EVALUATED", "trial", trial.id, "Trial KPI values evaluated", { kpis });
  res.json({ kpis });
});

app.post("/api/trials/:id/evaluate", requireDb, requireAuth, allow("officer"), async (req, res) => {
  const trial = await collection("trials").findOne({ id: req.params.id, officerId: req.user.id });
  if (!trial) return res.status(404).json({ error: "Trial not found." });
  if (!trial.kpis?.length || trial.kpis.some((kpi) => kpi.status === "PENDING")) return res.status(400).json({ error: "Evaluate every KPI before completing the trial." });
  const met = trial.kpis.filter((kpi) => kpi.status === "MET").length;
  const result = met === trial.kpis.length ? "SUCCESSFUL" : met > 0 ? "PARTIALLY_SUCCESSFUL" : "FAILED";
  const evaluation = { result, met, total: trial.kpis.length, evaluatedBy: req.user.id, evaluatedAt: now(), explanation: result === "SUCCESSFUL" ? "Pilot met the defined success criteria." : "Some defined targets were not met." };
  await collection("trials").updateOne({ id: trial.id }, { $set: { evaluation, status: "COMPLETED", updatedAt: now() } });
  await collection("applications").updateOne({ id: trial.applicationId }, { $set: { status: "COMPLETED", updatedAt: now() } });
  await notify(trial.startupId, "startup", "Trial completed", `The trial was marked ${result.toLowerCase().replaceAll("_", " ")}.`, "trial", { trialId: trial.id });
  await audit(req.user, "TRIAL_COMPLETED", "trial", trial.id, `Trial completed: ${result}`);
  res.json({ evaluation });
});

app.get("/api/decisions", requireDb, requireAuth, async (req, res) => {
  const filter = req.user.role === "officer" ? { decidedBy: req.user.id } : { startupId: req.user.id };
  res.json({ decisions: serialize(await collection("decisions").find(filter).sort({ timestamp: -1 }).toArray()) });
});

app.post("/api/decisions", requireDb, requireAuth, allow("officer"), async (req, res) => {
  const { trialId, type, notes, supportingEvidence = [] } = req.body || {};
  const explanations = {
    RECOMMEND_PROCUREMENT: "Pilot met the defined success criteria.",
    EXTEND_TRIAL: "Collect more evidence before deciding.",
    REQUEST_MORE_EVIDENCE: "Ask the startup to clarify a gap.",
    REJECT: "Outcome did not meet the target."
  };
  if (!explanations[type]) return res.status(400).json({ error: "Choose a valid decision." });
  const trial = await collection("trials").findOne({ id: trialId, officerId: req.user.id, status: "COMPLETED" });
  if (!trial) return res.status(404).json({ error: "Completed trial not found." });
  if (type === "RECOMMEND_PROCUREMENT" && trial.evaluation?.result !== "SUCCESSFUL") return res.status(400).json({ error: "Procurement can only be recommended after a successful trial." });
  const extensionEndDate = type === "EXTEND_TRIAL" ? String(req.body.extensionEndDate || "") : "";
  if (type === "EXTEND_TRIAL" && !extensionEndDate) return res.status(400).json({ error: "Provide a new trial end date for the extension." });
  const evidenceRequest = type === "REQUEST_MORE_EVIDENCE" ? String(req.body.evidenceRequest || notes || "Please provide the requested supporting evidence.") : "";
  const decision = { id: id(), trialId, applicationId: trial.applicationId, startupId: trial.startupId, type, reason: explanations[type], notes: notes || "", evidenceRequest, supportingEvidence, decidedBy: req.user.id, timestamp: now() };
  await collection("decisions").insertOne(decision);
  if (type === "EXTEND_TRIAL") {
    await collection("trials").updateOne({ id: trial.id }, { $set: { status: "ACTIVE", endDate: extensionEndDate, extension: { extendedBy: req.user.id, extendedAt: now(), reason: notes || explanations[type] }, updatedAt: now() } });
  }
  const applicationStatus = type === "RECOMMEND_PROCUREMENT" ? "SELECTED" : type === "REJECT" ? "REJECTED" : type === "REQUEST_MORE_EVIDENCE" ? "MORE_EVIDENCE_REQUESTED" : "TRIAL";
  await collection("applications").updateOne({ id: trial.applicationId }, { $set: { status: applicationStatus, updatedAt: now() } });
  const decisionTitle = type === "RECOMMEND_PROCUREMENT" ? "Procurement recommendation" : type === "REJECT" ? "Application rejected" : type === "EXTEND_TRIAL" ? "Trial extended" : type === "REQUEST_MORE_EVIDENCE" ? "Evidence requested" : "Decision recorded";
  const decisionMessage = type === "REQUEST_MORE_EVIDENCE" ? evidenceRequest : explanations[type];
  await notify(trial.startupId, "startup", decisionTitle, decisionMessage, "decision", { decisionId: decision.id, trialId });
  await audit(req.user, type === "RECOMMEND_PROCUREMENT" ? "PROCUREMENT_RECOMMENDATION" : type === "EXTEND_TRIAL" ? "TRIAL_EXTENDED" : type === "REQUEST_MORE_EVIDENCE" ? "EVIDENCE_REQUESTED" : "DECISION_MADE", "decision", decision.id, explanations[type], { extensionEndDate, evidenceRequest });
  res.status(201).json({ decision: serialize(decision), trial: type === "EXTEND_TRIAL" ? serialize({ ...trial, status: "ACTIVE", endDate: extensionEndDate }) : undefined });
});

app.patch("/api/trials/:id/pack-ready", requireDb, requireAuth, allow("officer"), async (req, res) => {
  const trial = await collection("trials").findOne({ id: req.params.id });
  if (!trial) return res.status(404).json({ error: "Trial not found." });
  await collection("trials").updateOne({ id: trial.id }, { $set: { packReady: true, packReadyAt: now(), updatedAt: now() } });
  await audit(req.user, "DECISION_PACK_READY", "trial", trial.id, "Decision pack marked ready");
  await notify(trial.startupId, "startup", "Decision pack updated", "The officer marked the decision pack ready for review.", "decision", { trialId: trial.id, page: "Applications & Trials" });
  res.json({ ok: true });
});

app.get("/api/scale/opportunities", requireDb, requireAuth, allow("officer", "admin"), async (req, res) => {
  const successful = await collection("trials").find({ status: "COMPLETED", "evaluation.result": "SUCCESSFUL" }).sort({ updatedAt: -1 }).limit(50).toArray();
  const opportunities = [];
  for (const trial of successful) {
    const problem = await collection("problems").findOne({ id: trial.problemId });
    const startup = await collection("users").findOne({ id: trial.startupId });
    const decision = await collection("decisions").findOne({ trialId: trial.id, type: "RECOMMEND_PROCUREMENT" });
    opportunities.push({
      id: `SCALE-${trial.id.slice(0, 8).toUpperCase()}`, trialId: trial.id, problemId: trial.problemId,
      solution: problem?.title || "Successful pilot solution", department: problem?.department || "Receiving department",
      sourceLocation: trial.location || problem?.location || "Maharashtra", startupName: startup?.startupName || startup?.name || "Registered startup",
      procurementRecommended: Boolean(decision), kpiAchievement: trial.evaluation?.total ? Math.round((trial.evaluation.met / trial.evaluation.total) * 100) : 0,
      isDemo: Boolean(trial.isDemo)
    });
  }
  res.json({ opportunities: serialize(opportunities) });
});

app.get("/api/startups/trust-passport", requireDb, requireAuth, allow("startup"), async (req, res) => {
  const startupId = req.user.id;
  const trials = await collection("trials").find({ startupId }).toArray();
  const completed = trials.filter(t => t.status === "COMPLETED");
  const successful = completed.filter(t => t.evaluation?.result === "SUCCESSFUL");
  const kpis = completed.flatMap(t => t.kpis || []).filter(k => ["MET", "NOT_MET"].includes(k.status));
  const met = kpis.filter(k => k.status === "MET").length;
  const decisions = await collection("decisions").find({ startupId }).toArray();
  const procurement = decisions.filter(d => d.type === "RECOMMEND_PROCUREMENT").length;
  const evidence = await collection("evidence").countDocuments({ uploadedBy: startupId });
  const score = Math.min(100, Math.round((completed.length ? 30 : 0) + (successful.length ? Math.min(30, successful.length * 15) : 0) + (kpis.length ? (met / kpis.length) * 25 : 0) + (evidence ? 15 : 0)));
  res.json({ passport: { score, completedPilots: completed.length, successfulPilots: successful.length, kpiAchievement: kpis.length ? Math.round((met / kpis.length) * 100) : null, procurementRecommendations: procurement, evidenceCount: evidence, sufficientHistory: trials.length > 0, isDemo: Boolean(req.user.isDemo) } });
});

app.get("/api/notifications", requireDb, requireAuth, async (req, res) => {
  const items = await collection("notifications").find({ recipient: req.user.id }).sort({ createdAt: -1 }).limit(100).toArray();
  res.json({ notifications: serialize(items), unread: items.filter((item) => !item.read).length });
});

app.post("/api/notifications", requireDb, requireAuth, allow("officer", "admin"), async (req, res) => {
  const { recipient, title, message, type = "update", relatedEntity = {} } = req.body || {};
  if (!recipient || !title || !message) return res.status(400).json({ error: "Recipient, title and message are required." });
  const target = await collection("users").findOne({ id: recipient });
  if (!target) return res.status(404).json({ error: "Recipient not found." });
  await notify(target.id, target.role, String(title), String(message), type, relatedEntity);
  await audit(req.user, "NOTIFICATION_SENT", "notification", target.id, `Notification sent to ${target.name || target.email}`);
  res.status(201).json({ ok: true });
});

app.patch("/api/notifications/read-all", requireDb, requireAuth, async (req, res) => {
  await collection("notifications").updateMany({ recipient: req.user.id, read: false }, { $set: { read: true } });
  res.json({ ok: true });
});

app.get("/api/audit", requireDb, requireAuth, async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { $or: [{ actor: req.user.id }, { role: "system" }] };
  res.json({ events: serialize(await collection("audit_events").find(filter).sort({ timestamp: -1 }).limit(200).toArray()) });
});

app.post("/api/evidence", requireDb, requireAuth, evidenceUpload.single("file"), async (req, res) => {
  const body = req.body || {};
  const relatedTrial = body.relatedTrial || "";
  const relatedApplication = body.relatedApplication || "";
  if (!await canAccessRelatedRecord(req.user, relatedTrial, relatedApplication)) {
    return res.status(403).json({ error: "You are not allowed to upload evidence for this record." });
  }
  const fileName = req.file?.originalname || body.fileName;
  const fileType = req.file?.mimetype || body.fileType;
  if (!fileName || !fileType) return res.status(400).json({ error: "File name and file type are required." });
  let storageReference = body.storageReference || `local-demo://${id()}/${fileName}`;
  let isDemo = true;
  if (req.file && firebaseBucket) {
    const storagePath = `evidence/${req.user.id}/${id()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const storedFile = firebaseBucket.file(storagePath);
    await storedFile.save(req.file.buffer, {
      resumable: false,
      validation: "md5",
      metadata: {
        contentType: req.file.mimetype,
        metadata: { uploadedBy: req.user.id, relatedTrial, relatedApplication }
      }
    });
    storageReference = `gs://${firebaseBucket.name}/${storagePath}`;
    isDemo = false;
  }
  const evidence = {
    id: id(), fileName, fileType, fileSize: req.file?.size || Number(body.fileSize || 0),
    storageReference, uploadedBy: req.user.id, relatedTrial, relatedApplication,
    createdAt: now(), isDemo
  };
  await collection("evidence").insertOne(evidence);
  if (relatedTrial) await collection("trials").updateOne({ id: relatedTrial }, { $addToSet: { evidenceIds: evidence.id } });
  await audit(req.user, "EVIDENCE_UPLOADED", "evidence", evidence.id, `Evidence uploaded: ${fileName}`, { isDemo });
  res.status(201).json({ evidence: serialize(evidence) });
});

app.get("/api/evidence", requireDb, requireAuth, async (req, res) => {
  const filter = req.user.role === "startup" ? { uploadedBy: req.user.id } : {};
  const evidence = await collection("evidence").find(filter).sort({ createdAt: -1 }).limit(100).toArray();
  res.json({ evidence: serialize(evidence) });
});

app.get("/api/evidence/:id", requireDb, requireAuth, async (req, res) => {
  const evidence = await collection("evidence").findOne({ id: req.params.id });
  const unlinkedOwner = evidence && !evidence.relatedTrial && !evidence.relatedApplication &&
    (evidence.uploadedBy === req.user.id || req.user.role === "admin");
  const linkedAccess = evidence && (evidence.relatedTrial || evidence.relatedApplication) &&
    await canAccessRelatedRecord(req.user, evidence.relatedTrial, evidence.relatedApplication);
  if (!evidence || (!unlinkedOwner && !linkedAccess)) {
    return res.status(404).json({ error: "Evidence not found." });
  }
  let downloadUrl = null;
  if (!evidence.isDemo && firebaseBucket && evidence.storageReference.startsWith("gs://")) {
    const storagePath = evidence.storageReference.slice(`gs://${firebaseBucket.name}/`.length);
    [downloadUrl] = await firebaseBucket.file(storagePath).getSignedUrl({
      action: "read", expires: Date.now() + 15 * 60 * 1000
    });
  }
  res.json({ evidence: serialize(evidence), downloadUrl });
});

app.get("/api/grievances", requireDb, requireAuth, async (req, res) => {
  const filter = req.user.role === "startup" ? { submittedBy: req.user.id } : {};
  res.json({ grievances: serialize(await collection("grievances").find(filter).sort({ createdAt: -1 }).toArray()) });
});

app.post("/api/grievances", requireDb, requireAuth, allow("startup"), async (req, res) => {
  const { relatedApplication, relatedTrial, type, description, supportingEvidence = [] } = req.body || {};
  if (!type || !description) return res.status(400).json({ error: "Grievance type and description are required." });
  const grievance = { id: id(), relatedApplication: relatedApplication || "", relatedTrial: relatedTrial || "", type, description, supportingEvidence, submittedBy: req.user.id, status: "OPEN", createdAt: now(), updatedAt: now() };
  await collection("grievances").insertOne(grievance);
  const admins = await collection("users").find({ role: "admin" }).project({ id: 1 }).toArray();
  for (const admin of admins) await notify(admin.id, "admin", "New grievance", "A startup submitted a grievance for review.", "grievance", { grievanceId: grievance.id });
  await audit(req.user, "GRIEVANCE_SUBMITTED", "grievance", grievance.id, "Grievance submitted for review");
  res.status(201).json({ grievance: serialize(grievance) });
});

app.get("/api/users/startups", requireDb, requireAuth, allow("officer", "admin"), async (req, res) => {
  const users = await collection("users").find({ role: "startup" }).project({ id:1, name:1, email:1, startupName:1 }).limit(100).toArray();
  res.json({ users: serialize(users) });
});

app.get("/api/search", requireDb, requireAuth, async (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  if (q.length < 2) return res.json({ results: [] });
  const contains = (value) => String(value || "").toLowerCase().includes(q);
  const results = [];
  const [problems, users, trials, grievances] = await Promise.all([
    collection("problems").find({}).limit(100).toArray(), collection("users").find({}).limit(200).toArray(),
    collection("trials").find({}).limit(100).toArray(), collection("grievances").find({}).limit(100).toArray()
  ]);
  for (const x of problems) if (contains(x.title) || contains(x.id) || contains(x.department)) results.push({ type:"Problem", title:x.title, id:x.id, page:"Problems" });
  for (const x of users) if (contains(x.name) || contains(x.startupName) || contains(x.email)) results.push({ type:x.role === "startup" ? "Startup" : "User", title:x.startupName || x.name, id:x.id, page:x.role === "startup" ? "AI Matches" : "Profile" });
  for (const x of trials) if (contains(x.id) || contains(x.problemId) || contains(x.location)) results.push({ type:"Pilot", title:`Pilot ${x.id.slice(0,8)}`, id:x.id, page:"Trials" });
  for (const x of grievances) if (contains(x.id) || contains(x.type) || contains(x.description)) results.push({ type:"Grievance", title:`Grievance ${x.id.slice(0,8)}`, id:x.id, page:"Grievances" });
  res.json({ results: results.slice(0,20) });
});

app.get("/api/admin/district-activity", requireDb, requireAuth, allow("admin"), async (req, res) => {
  const districts = ["Ahmednagar","Akola","Amravati","Aurangabad","Beed","Bhandara","Buldhana","Chandrapur","Dhule","Gadchiroli","Gondia","Hingoli","Jalgaon","Jalna","Kolhapur","Latur","Mumbai City","Mumbai Suburban","Nagpur","Nanded","Nandurbar","Nashik","Osmanabad","Palghar","Parbhani","Pune","Raigad","Ratnagiri","Sangli","Satara","Sindhudurg","Solapur","Thane","Wardha","Washim","Yavatmal"];
  const problems = await collection("problems").find({}).toArray(); const trials = await collection("trials").find({}).toArray();
  const startups = await collection("users").find({ role:"startup" }).toArray();
  const activity = districts.map(d => { const p=problems.filter(x=>String(x.location||x.district||"").toLowerCase().includes(d.toLowerCase())).length; const t=trials.filter(x=>String(x.location||"").toLowerCase().includes(d.toLowerCase())).length; const s=startups.filter(x=>String(x.profile?.location||x.location||"").toLowerCase().includes(d.toLowerCase())).length; return {district:d, problems:p, pilots:t, startups:s, activity:p+t+s}; });
  res.json({ districts: activity });
});

app.get("/api/admin/stats", requireDb, requireAuth, allow("admin"), async (req, res) => {
  const count = async (name, filter = {}) => collection(name).countDocuments(filter);
  res.json({ stats: {
    problems: await count("problems"), applications: await count("applications"),
    activeTrials: await count("trials", { status: "ACTIVE" }), completedTrials: await count("trials", { status: "COMPLETED" }),
    successfulTrials: await count("trials", { "evaluation.result": "SUCCESSFUL" }),
    procurementRecommendations: await count("decisions", { type: "RECOMMEND_PROCUREMENT" }),
    openGrievances: await count("grievances", { status: { $in: ["OPEN", "UNDER_REVIEW"] } }),
    startups: await count("users", { role: "startup" }),
    officers: await count("users", { role: "officer" }),
    replicationReady: await count("trials", { status: "COMPLETED", "evaluation.result": "SUCCESSFUL" })
  } });
});

// Role-aware dashboard stats — drives live counters in all three dashboards
app.get("/api/dashboard/stats", requireDb, requireAuth, async (req, res) => {
  const uid = req.user.id;
  const role = req.user.role;
  try {
    if (role === "officer") {
      const [activeProblems, applications, activeTrials, awaitingEval, unread] = await Promise.all([
        collection("problems").countDocuments({ createdBy: uid, status: { $in: ["OPEN", "MATCHING", "SHORTLISTED", "TRIAL"] } }),
        collection("applications").countDocuments({ officerId: uid }),
        collection("trials").countDocuments({ officerId: uid, status: "ACTIVE" }),
        collection("trials").countDocuments({ officerId: uid, status: "COMPLETED", "evaluation": null }),
        collection("notifications").countDocuments({ recipient: uid, read: false })
      ]);
      // Recent problems for the activity panel
      const recentProblems = await collection("problems")
        .find({ createdBy: uid }).sort({ createdAt: -1 }).limit(5).toArray();
      return res.json({ stats: { activeProblems, applications, activeTrials, awaitingEval, unread }, recentProblems: serialize(recentProblems) });
    }
    if (role === "startup") {
      const [recommendedProblems, activeApplications, shortlisted, activePilots, unread] = await Promise.all([
        collection("problems").countDocuments({ status: { $in: ["OPEN", "MATCHING"] } }),
        collection("applications").countDocuments({ startupId: uid }),
        collection("applications").countDocuments({ startupId: uid, status: "SHORTLISTED" }),
        collection("trials").countDocuments({ startupId: uid, status: "ACTIVE" }),
        collection("notifications").countDocuments({ recipient: uid, read: false })
      ]);
      const nextMilestone = await collection("trials")
        .findOne({ startupId: uid, status: "ACTIVE" }, { sort: { createdAt: -1 } });
      return res.json({ stats: { recommendedProblems, activeApplications, shortlisted, activePilots, unread }, nextMilestone: nextMilestone ? serialize(nextMilestone) : null });
    }
    if (role === "admin") {
      const [startups, activeTrials, scaledSolutions, totalBudget, unread] = await Promise.all([
        collection("users").countDocuments({ role: "startup" }),
        collection("trials").countDocuments({ status: "ACTIVE" }),
        collection("decisions").countDocuments({ type: "RECOMMEND_PROCUREMENT" }),
        collection("trials").aggregate([{ $group: { _id: null, total: { $sum: "$budget" } } }]).toArray(),
        collection("notifications").countDocuments({ recipient: uid, read: false })
      ]);
      return res.json({ stats: { startups, activeTrials, scaledSolutions, totalBudget: totalBudget[0]?.total || 0, unread } });
    }
    res.json({ stats: {}, recentProblems: [] });
  } catch (err) {
    console.error("Dashboard stats error:", err.message);
    res.status(500).json({ error: "Could not load dashboard statistics." });
  }
});

app.use((error, req, res, next) => {
  console.error("Request failed:", error.message);
  const clientError = error instanceof multer.MulterError || error.message === "Only PDF, image and report files are supported.";
  res.status(clientError ? 400 : 500).json({ error: clientError ? error.message : "Something went wrong. Please try again." });
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

if (!SESSION_SECRET) throw new Error("SESSION_SECRET must be configured before starting the server");
initializeOptionalServices();
connectDatabase().finally(() => {
  app.listen(PORT, "0.0.0.0", () => console.log(`MAHA-INNOVATE running on port ${PORT}`));
});