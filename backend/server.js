// server.js  (PLAIN mysql — works with local XAMPP)
// npm i express cors mysql bcryptjs jsonwebtoken dotenv

const express = require("express");
const cors    = require("cors");
const mysql   = require("mysql");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
require("dotenv").config();

const app  = express();
const PORT = process.env.PORT || 5000;

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: (origin, cb) => {
      // allow server-to-server calls (no Origin header) and listed origins
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

// ── DB config ────────────────────────────────────────────────
const DB = {
  host    : process.env.DB_HOST     || "localhost",
  user    : process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || "careerkit",
  port    : process.env.DB_PORT     || 3306,
};

// ── Pool (plain mysql) ───────────────────────────────────────
const pool = mysql.createPool({
  connectionLimit: 10,
  host    : DB.host,
  user    : DB.user,
  password: DB.password,
  database: DB.database,
  port    : DB.port,
});

// ── Promise wrapper so you can use async/await everywhere ────
function dbQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

// ── Test connection on startup ───────────────────────────────
pool.getConnection((err, conn) => {
  if (err) {
    console.error("✖ MySQL connection failed:", err.message);
    return;
  }
  console.log("✔ MySQL connected:", DB.database, "on", `${DB.host}:${DB.port}`);
  conn.release();
});

// ── Auth helpers ─────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

function makeToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });
}

function requireLogin(req, res, next) {
  const header = req.headers.authorization || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Please log in." });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
}

// ── DB prepare ───────────────────────────────────────────────
async function prepare() {
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      full_name     VARCHAR(100)  NOT NULL,
      email         VARCHAR(255)  NOT NULL UNIQUE,
      password_hash VARCHAR(255)  NOT NULL,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS resumes (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      user_id    INT          NOT NULL,
      title      VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS resume_versions (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      resume_id      INT  NOT NULL,
      version_number INT  NOT NULL DEFAULT 1,
      contact_info   TEXT,
      summary        TEXT,
      created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
    )
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS education (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      version_id   INT          NOT NULL,
      institution  VARCHAR(255),
      degree       VARCHAR(255),
      start_date   VARCHAR(50),
      end_date     VARCHAR(50),
      FOREIGN KEY (version_id) REFERENCES resume_versions(id) ON DELETE CASCADE
    )
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS experience (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      version_id  INT          NOT NULL,
      company     VARCHAR(255),
      role        VARCHAR(255),
      description TEXT,
      start_date  VARCHAR(50),
      end_date    VARCHAR(50),
      FOREIGN KEY (version_id) REFERENCES resume_versions(id) ON DELETE CASCADE
    )
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS projects (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      version_id  INT          NOT NULL,
      name        VARCHAR(255),
      description TEXT,
      link        VARCHAR(500),
      FOREIGN KEY (version_id) REFERENCES resume_versions(id) ON DELETE CASCADE
    )
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS skills (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      version_id INT          NOT NULL,
      name       VARCHAR(255),
      category   VARCHAR(255),
      FOREIGN KEY (version_id) REFERENCES resume_versions(id) ON DELETE CASCADE
    )
  `);
}

// ---------- Health ----------
app.get("/", (req, res) => res.json({ status: "CareerKit API running" }));

// ---------- Auth ----------
app.post("/api/auth/register", async (req, res) => {
  const { full_name, email, password } = req.body;
  if (!full_name || !email || !password)
    return res.status(400).json({ error: "Name, email and password are required." });
  if (password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters." });

  try {
    const existing = await dbQuery("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0)
      return res.status(409).json({ error: "An account with this email already exists." });

    const hash   = await bcrypt.hash(password, 10);
    const result = await dbQuery(
      "INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)",
      [full_name, email, hash]
    );
    res.status(201).json({
      token: makeToken(result.insertId),
      user : { id: result.insertId, full_name, email },
    });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required." });

  try {
    const rows = await dbQuery("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0)
      return res.status(401).json({ error: "Invalid email or password." });

    const user = rows[0];
    const ok   = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid email or password." });

    res.json({
      token: makeToken(user.id),
      user : { id: user.id, full_name: user.full_name, email: user.email },
    });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.get("/api/auth/me", requireLogin, async (req, res) => {
  try {
    const rows = await dbQuery(
      "SELECT id, full_name, email FROM users WHERE id = ?",
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "User not found." });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

// ---------- Resumes ----------
app.get("/api/resumes", requireLogin, async (req, res) => {
  try {
    const rows = await dbQuery(
      `SELECT r.id, r.title, r.created_at,
              COUNT(v.id) AS version_count
         FROM resumes r
    LEFT JOIN resume_versions v ON v.resume_id = r.id
        WHERE r.user_id = ?
     GROUP BY r.id
     ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.post("/api/resumes", requireLogin, async (req, res) => {
  const title = (req.body.title || "Untitled Resume").trim();
  try {
    const result = await dbQuery(
      "INSERT INTO resumes (title, user_id) VALUES (?, ?)",
      [title, req.user.id]
    );
    await dbQuery(
      "INSERT INTO resume_versions (resume_id, version_number, contact_info, summary) VALUES (?, 1, '', '')",
      [result.insertId]
    );
    res.status(201).json({ id: result.insertId, title });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

// NOTE: /versions/:vid must come BEFORE /:id so Express doesn't swallow "versions" as the :id param.

app.get("/api/resumes/versions/:vid", requireLogin, async (req, res) => {
  try {
    const check = await dbQuery(
      `SELECT v.id FROM resume_versions v
         JOIN resumes r ON r.id = v.resume_id
        WHERE v.id = ? AND r.user_id = ?`,
      [req.params.vid, req.user.id]
    );
    if (check.length === 0) return res.status(404).json({ error: "Version not found." });

    const vid        = req.params.vid;
    const version    = (await dbQuery(
      "SELECT id, resume_id, version_number, contact_info, summary FROM resume_versions WHERE id = ?",
      [vid]
    ))[0];
    const education  = await dbQuery("SELECT * FROM education  WHERE version_id = ? ORDER BY id", [vid]);
    const experience = await dbQuery("SELECT * FROM experience WHERE version_id = ? ORDER BY id", [vid]);
    const projects   = await dbQuery("SELECT * FROM projects   WHERE version_id = ? ORDER BY id", [vid]);
    const skills     = await dbQuery("SELECT * FROM skills     WHERE version_id = ? ORDER BY id", [vid]);

    res.json({ ...version, education, experience, projects, skills });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.put("/api/resumes/versions/:vid", requireLogin, async (req, res) => {
  try {
    const check = await dbQuery(
      `SELECT v.id FROM resume_versions v
         JOIN resumes r ON r.id = v.resume_id
        WHERE v.id = ? AND r.user_id = ?`,
      [req.params.vid, req.user.id]
    );
    if (check.length === 0) return res.status(404).json({ error: "Version not found." });

    await dbQuery(
      "UPDATE resume_versions SET contact_info = ?, summary = ? WHERE id = ?",
      [req.body.contact_info || "", req.body.summary || "", req.params.vid]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.get("/api/resumes/:id", requireLogin, async (req, res) => {
  try {
    const own = await dbQuery(
      "SELECT id, title FROM resumes WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (own.length === 0) return res.status(404).json({ error: "Resume not found." });

    const versions = await dbQuery(
      "SELECT id, version_number, created_at FROM resume_versions WHERE resume_id = ? ORDER BY version_number DESC",
      [req.params.id]
    );
    res.json({ ...own[0], versions });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.put("/api/resumes/:id", requireLogin, async (req, res) => {
  try {
    const own = await dbQuery(
      "SELECT id FROM resumes WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (own.length === 0) return res.status(404).json({ error: "Resume not found." });

    await dbQuery("UPDATE resumes SET title = ? WHERE id = ?", [
      (req.body.title || "Untitled Resume").trim(),
      req.params.id,
    ]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.delete("/api/resumes/:id", requireLogin, async (req, res) => {
  try {
    const own = await dbQuery(
      "SELECT id FROM resumes WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (own.length === 0) return res.status(404).json({ error: "Resume not found." });

    await dbQuery("DELETE FROM resumes WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.post("/api/resumes/:id/versions", requireLogin, async (req, res) => {
  const sourceVid = req.body.source_version_id;
  try {
    const own = await dbQuery(
      "SELECT id FROM resumes WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (own.length === 0) return res.status(404).json({ error: "Resume not found." });

    const nextRows = await dbQuery(
      "SELECT COALESCE(MAX(version_number), 0) + 1 AS next FROM resume_versions WHERE resume_id = ?",
      [req.params.id]
    );
    const next = nextRows[0].next;

    let contact = "", summary = "";
    if (sourceVid) {
      const src = (await dbQuery(
        "SELECT contact_info, summary FROM resume_versions WHERE id = ? AND resume_id = ?",
        [sourceVid, req.params.id]
      ))[0];
      if (src) { contact = src.contact_info; summary = src.summary; }
    }

    const result = await dbQuery(
      "INSERT INTO resume_versions (resume_id, version_number, contact_info, summary) VALUES (?, ?, ?, ?)",
      [req.params.id, next, contact, summary]
    );
    const newVid = result.insertId;

    if (sourceVid) {
      await dbQuery(
        "INSERT INTO education (version_id, institution, degree, start_date, end_date) SELECT ?, institution, degree, start_date, end_date FROM education WHERE version_id = ?",
        [newVid, sourceVid]
      );
      await dbQuery(
        "INSERT INTO experience (version_id, company, role, description, start_date, end_date) SELECT ?, company, role, description, start_date, end_date FROM experience WHERE version_id = ?",
        [newVid, sourceVid]
      );
      await dbQuery(
        "INSERT INTO projects (version_id, name, description, link) SELECT ?, name, description, link FROM projects WHERE version_id = ?",
        [newVid, sourceVid]
      );
      await dbQuery(
        "INSERT INTO skills (version_id, name, category) SELECT ?, name, category FROM skills WHERE version_id = ?",
        [newVid, sourceVid]
      );
    }

    res.status(201).json({ id: newVid, version_number: next });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

// ---------- Sections ----------
const SECTIONS = {
  education : { table: "education",  cols: ["institution", "degree", "start_date", "end_date"] },
  experience: { table: "experience", cols: ["company", "role", "description", "start_date", "end_date"] },
  projects  : { table: "projects",   cols: ["name", "description", "link"] },
  skills    : { table: "skills",     cols: ["name", "category"] },
};

app.post("/api/sections/:type", requireLogin, async (req, res) => {
  const cfg = SECTIONS[req.params.type];
  if (!cfg) return res.status(400).json({ error: "Unknown section type." });

  const versionId = req.body.version_id;
  try {
    const check = await dbQuery(
      `SELECT v.id FROM resume_versions v
         JOIN resumes r ON r.id = v.resume_id
        WHERE v.id = ? AND r.user_id = ?`,
      [versionId, req.user.id]
    );
    if (check.length === 0) return res.status(404).json({ error: "Version not found." });

    const values       = cfg.cols.map((c) => req.body[c] ?? null);
    const placeholders = cfg.cols.map(() => "?").join(", ");
    const result = await dbQuery(
      `INSERT INTO ${cfg.table} (version_id, ${cfg.cols.join(", ")}) VALUES (?, ${placeholders})`,
      [versionId, ...values]
    );
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.put("/api/sections/:type/:id", requireLogin, async (req, res) => {
  const cfg = SECTIONS[req.params.type];
  if (!cfg) return res.status(400).json({ error: "Unknown section type." });

  try {
    const check = await dbQuery(
      `SELECT s.id FROM ${cfg.table} s
         JOIN resume_versions v ON v.id = s.version_id
         JOIN resumes r ON r.id = v.resume_id
        WHERE s.id = ? AND r.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (check.length === 0) return res.status(404).json({ error: "Item not found." });

    const setClause = cfg.cols.map((c) => `${c} = ?`).join(", ");
    const values    = cfg.cols.map((c) => req.body[c] ?? null);
    await dbQuery(`UPDATE ${cfg.table} SET ${setClause} WHERE id = ?`, [
      ...values,
      req.params.id,
    ]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.delete("/api/sections/:type/:id", requireLogin, async (req, res) => {
  const cfg = SECTIONS[req.params.type];
  if (!cfg) return res.status(400).json({ error: "Unknown section type." });

  try {
    const check = await dbQuery(
      `SELECT s.id FROM ${cfg.table} s
         JOIN resume_versions v ON v.id = s.version_id
         JOIN resumes r ON r.id = v.resume_id
        WHERE s.id = ? AND r.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (check.length === 0) return res.status(404).json({ error: "Item not found." });

    await dbQuery(`DELETE FROM ${cfg.table} WHERE id = ?`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

// ---------- Start ----------
prepare()
  .then(() => {
    app.listen(PORT, () => console.log(`CareerKit API running on http://localhost:${PORT}`));
  })
  .catch((e) => {
    console.error("Startup failed:", e.message || e);
    process.exit(1);
  });
