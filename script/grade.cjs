#!/usr/bin/env node

/**
 * Lab Autograder — 8-1 Thirdparty API Authentication Password Hasing
 *
 * Grades based on:
 * - server.js
 *
 * Marking:
 * - 80 marks for lab TODOs
 * - 20 marks for submission timing
 *   - On/before deadline => 20/20
 *   - After deadline     => 10/20
 *
 * Deadline: 20 Apr 2026 20:59 (Asia/Riyadh, UTC+03:00)
 *
 * Expected repo layout:
 * - project folder: 8-1-Thirdparty-API-Authentication-Password-Hasing/
 * - grader file:    script/grade.cjs
 * - student file:   server.js
 *
 * Notes:
 * - JS comments are ignored, so starter TODO comments do NOT count.
 * - Checks are intentionally lenient and verify top-level implementation only.
 * - Code can be in any order.
 * - Postman/manual route testing is NOT part of grading.
 * - We only grade coding in server.js.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ARTIFACTS_DIR = "artifacts";
const FEEDBACK_DIR = path.join(ARTIFACTS_DIR, "feedback");
fs.mkdirSync(FEEDBACK_DIR, { recursive: true });

/* -----------------------------
   Deadline (Asia/Riyadh)
   20 Apr 2026, 20:59
-------------------------------- */
const DEADLINE_RIYADH_ISO = "2026-04-20T20:59:00+03:00";
const DEADLINE_MS = Date.parse(DEADLINE_RIYADH_ISO);

// Submission marks policy
const SUBMISSION_MAX = 20;
const SUBMISSION_LATE = 10;

/* -----------------------------
   TODO marks (out of 80)
-------------------------------- */
const tasks = [
  { id: "t1", name: "TODO 1: POST /register", marks: 28 },
  { id: "t2", name: "TODO 2: POST /login", marks: 26 },
  { id: "t3", name: "TODO 3: GET /weather", marks: 26 },
];

const STEPS_MAX = tasks.reduce((sum, t) => sum + t.marks, 0);
const TOTAL_MAX = STEPS_MAX + SUBMISSION_MAX;

/* -----------------------------
   Helpers
-------------------------------- */
function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function mdEscape(s) {
  return String(s).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function splitMarks(stepMarks, missingCount, totalChecks) {
  if (missingCount <= 0) return stepMarks;
  const perItem = stepMarks / totalChecks;
  const deducted = perItem * missingCount;
  return Math.max(0, round2(stepMarks - deducted));
}

function existsFile(p) {
  try {
    return fs.existsSync(p) && fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

/**
 * Strip JS comments while trying to preserve strings/templates.
 */
function stripJsComments(code) {
  if (!code) return code;

  let out = "";
  let i = 0;

  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;

  while (i < code.length) {
    const ch = code[i];
    const next = code[i + 1];

    if (!inDouble && !inTemplate && ch === "'" && !inSingle) {
      inSingle = true;
      out += ch;
      i++;
      continue;
    }
    if (inSingle && ch === "'") {
      let backslashes = 0;
      for (let k = i - 1; k >= 0 && code[k] === "\\"; k--) backslashes++;
      if (backslashes % 2 === 0) inSingle = false;
      out += ch;
      i++;
      continue;
    }

    if (!inSingle && !inTemplate && ch === '"' && !inDouble) {
      inDouble = true;
      out += ch;
      i++;
      continue;
    }
    if (inDouble && ch === '"') {
      let backslashes = 0;
      for (let k = i - 1; k >= 0 && code[k] === "\\"; k--) backslashes++;
      if (backslashes % 2 === 0) inDouble = false;
      out += ch;
      i++;
      continue;
    }

    if (!inSingle && !inDouble && ch === "`" && !inTemplate) {
      inTemplate = true;
      out += ch;
      i++;
      continue;
    }
    if (inTemplate && ch === "`") {
      let backslashes = 0;
      for (let k = i - 1; k >= 0 && code[k] === "\\"; k--) backslashes++;
      if (backslashes % 2 === 0) inTemplate = false;
      out += ch;
      i++;
      continue;
    }

    if (!inSingle && !inDouble && !inTemplate) {
      if (ch === "/" && next === "/") {
        i += 2;
        while (i < code.length && code[i] !== "\n") i++;
        continue;
      }
      if (ch === "/" && next === "*") {
        i += 2;
        while (i < code.length) {
          if (code[i] === "*" && code[i + 1] === "/") {
            i += 2;
            break;
          }
          i++;
        }
        continue;
      }
    }

    out += ch;
    i++;
  }

  return out;
}

/* -----------------------------
   Project root detection
-------------------------------- */
const REPO_ROOT = process.cwd();
const GRADER_DIR = __dirname;

function pickProjectRoot() {
  const fromScriptParent = path.resolve(GRADER_DIR, "..");
  if (existsFile(path.join(fromScriptParent, "server.js"))) {
    return fromScriptParent;
  }

  if (existsFile(path.join(REPO_ROOT, "server.js"))) {
    return REPO_ROOT;
  }

  const nestedMain = path.join(
    REPO_ROOT,
    "8-1-Thirdparty-API-Authentication-Password-Hasing"
  );
  if (existsFile(path.join(nestedMain, "server.js"))) {
    return nestedMain;
  }

  let subs = [];
  try {
    subs = fs
      .readdirSync(REPO_ROOT, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    subs = [];
  }

  for (const name of subs) {
    const p = path.join(REPO_ROOT, name);
    if (existsFile(path.join(p, "server.js"))) {
      return p;
    }
  }

  return fromScriptParent;
}

const PROJECT_ROOT = pickProjectRoot();

/* -----------------------------
   Find files
-------------------------------- */
const serverFile = path.join(PROJECT_ROOT, "server.js");

/* -----------------------------
   Determine submission time
-------------------------------- */
let lastCommitISO = null;
let lastCommitMS = null;

try {
  lastCommitISO = execSync("git log -1 --format=%cI", { encoding: "utf8" }).trim();
  lastCommitMS = Date.parse(lastCommitISO);
} catch {
  lastCommitISO = new Date().toISOString();
  lastCommitMS = Date.now();
}

/* -----------------------------
   Submission marks
-------------------------------- */
const isLate = Number.isFinite(lastCommitMS) ? lastCommitMS > DEADLINE_MS : true;
const submissionScore = isLate ? SUBMISSION_LATE : SUBMISSION_MAX;

/* -----------------------------
   Load & strip student file
-------------------------------- */
const serverRaw = existsFile(serverFile) ? safeRead(serverFile) : null;
const serverCode = serverRaw ? stripJsComments(serverRaw) : null;

const results = [];

/* -----------------------------
   Result helpers
-------------------------------- */
function addResult(task, required) {
  const missing = required.filter((r) => !r.ok);
  const score = splitMarks(task.marks, missing.length, required.length);

  results.push({
    id: task.id,
    name: task.name,
    max: task.marks,
    score,
    checklist: required.map((r) => `${r.ok ? "✅" : "❌"} ${r.label}`),
    deductions: missing.length ? missing.map((m) => `Missing: ${m.label}`) : [],
  });
}

function failTask(task, reason) {
  results.push({
    id: task.id,
    name: task.name,
    max: task.marks,
    score: 0,
    checklist: [],
    deductions: [reason],
  });
}

/* -----------------------------
   Grade TODO 1 — POST /register
-------------------------------- */
{
  const task = tasks[0];

  if (!serverCode) {
    failTask(task, "server.js not found / unreadable.");
  } else {
    const required = [
      {
        label: 'Defines POST route for "/register"',
        ok: /app\.post\s*\(\s*['"]\/register['"]/i.test(serverCode),
      },
      {
        label: "Reads req.body or destructures email/password from req.body",
        ok:
          /req\.body/i.test(serverCode) ||
          /const\s*\{\s*email\s*,\s*password\s*\}\s*=\s*req\.body/i.test(serverCode),
      },
      {
        label: "Validates missing email/password",
        ok:
          /!\s*email\s*\|\|\s*!\s*password/i.test(serverCode) ||
          /email\s*&&\s*password/i.test(serverCode),
      },
      {
        label: 'Returns 400 for missing email/password',
        ok:
          /status\s*\(\s*400\s*\)\.json\s*\(\s*\{\s*error\s*:\s*['"]Email and password are required['"]/i.test(serverCode) ||
          /status\s*\(\s*400\s*\)/i.test(serverCode),
      },
      {
        label: "Handles duplicate registration somehow",
        ok:
          /User already exists/i.test(serverCode) ||
          /existing/i.test(serverCode) ||
          /already exists/i.test(serverCode),
      },
      {
        label: "Uses bcrypt.hash(...) to hash password",
        ok: /bcrypt\.hash\s*\(/i.test(serverCode),
      },
      {
        label: "Stores user with email and password hash",
        ok:
          /users\.push\s*\(/i.test(serverCode) &&
          /passwordHash/i.test(serverCode),
      },
      {
        label: "Returns 201 on successful registration",
        ok:
          /status\s*\(\s*201\s*\)\.json\s*\(/i.test(serverCode) ||
          /status\s*\(\s*201\s*\)\.send\s*\(/i.test(serverCode),
      },
      {
        label: "Has register error handling",
        ok:
          /Register error:/i.test(serverCode) ||
          /Server error during register/i.test(serverCode) ||
          /catch\s*\(\s*err\s*\)/i.test(serverCode),
      },
    ];

    addResult(task, required);
  }
}

/* -----------------------------
   Grade TODO 2 — POST /login
-------------------------------- */
{
  const task = tasks[1];

  if (!serverCode) {
    failTask(task, "server.js not found / unreadable.");
  } else {
    const required = [
      {
        label: 'Defines POST route for "/login"',
        ok: /app\.post\s*\(\s*['"]\/login['"]/i.test(serverCode),
      },
      {
        label: "Reads req.body or destructures email/password from req.body",
        ok:
          /req\.body/i.test(serverCode) ||
          /const\s*\{\s*email\s*,\s*password\s*\}\s*=\s*req\.body/i.test(serverCode),
      },
      {
        label: "Handles user lookup / missing user case",
        ok:
          /User not found/i.test(serverCode) ||
          /!user/i.test(serverCode) ||
          /users\.find\s*\(/i.test(serverCode),
      },
      {
        label: "Uses bcrypt.compare(...)",
        ok: /bcrypt\.compare\s*\(/i.test(serverCode),
      },
      {
        label: 'Returns wrong-password response',
        ok:
          /Wrong password/i.test(serverCode) ||
          (/status\s*\(\s*400\s*\)/i.test(serverCode) && /match/i.test(serverCode)),
      },
      {
        label: "Creates JWT using jwt.sign(...)",
        ok: /jwt\.sign\s*\(/i.test(serverCode),
      },
      {
        label: 'Uses JWT secret "abc123" or JWT_SECRET in jwt.sign',
        ok:
          /jwt\.sign\s*\([\s\S]*?JWT_SECRET[\s\S]*?\)/i.test(serverCode) ||
          /jwt\.sign\s*\([\s\S]*?['"]abc123['"][\s\S]*?\)/i.test(serverCode),
      },
      {
        label: 'Uses expiresIn "1h" or equivalent',
        ok: /expiresIn\s*:\s*['"]1h['"]/i.test(serverCode),
      },
      {
        label: "Returns token response",
        ok:
          /res\.json\s*\(\s*\{\s*token\s*\}\s*\)/i.test(serverCode) ||
          /res\.status\s*\(\s*200\s*\)\.json\s*\(\s*\{\s*token\s*\}\s*\)/i.test(serverCode),
      },
      {
        label: "Has login error handling",
        ok:
          /Login error:/i.test(serverCode) ||
          /Server error during login/i.test(serverCode) ||
          /catch\s*\(\s*err\s*\)/i.test(serverCode),
      },
    ];

    addResult(task, required);
  }
}

/* -----------------------------
   Grade TODO 3 — GET /weather
-------------------------------- */
{
  const task = tasks[2];

  if (!serverCode) {
    failTask(task, "server.js not found / unreadable.");
  } else {
    const required = [
      {
        label: 'Defines GET route for "/weather"',
        ok: /app\.get\s*\(\s*['"]\/weather['"]/i.test(serverCode),
      },
      {
        label: "Reads Authorization header",
        ok:
          /req\.headers\.authorization/i.test(serverCode) ||
          /headers\s*\[\s*['"]authorization['"]\s*\]/i.test(serverCode),
      },
      {
        label: 'Returns 401 when token/header is missing',
        ok:
          /Missing token/i.test(serverCode) ||
          /status\s*\(\s*401\s*\)\.json\s*\(/i.test(serverCode),
      },
      {
        label: "Extracts bearer token",
        ok:
          /auth\.split\s*\(\s*['"] ['"]\s*\)\s*\[\s*1\s*\]/i.test(serverCode) ||
          /split\s*\(\s*['"] ['"]\s*\)\s*\[\s*1\s*\]/i.test(serverCode),
      },
      {
        label: "Verifies JWT using jwt.verify(...)",
        ok: /jwt\.verify\s*\(/i.test(serverCode),
      },
      {
        label: 'Returns invalid-token response',
        ok:
          /Invalid token/i.test(serverCode) ||
          /status\s*\(\s*401\s*\)\.json\s*\(/i.test(serverCode),
      },
      {
        label: "Reads city from req.query.city",
        ok: /req\.query\.city/i.test(serverCode),
      },
      {
        label: 'Returns city-required response',
        ok:
          /City required/i.test(serverCode) ||
          /status\s*\(\s*400\s*\)\.json\s*\(/i.test(serverCode),
      },
      {
        label: "Builds some external weather API URL using the city",
        ok:
          /encodeURIComponent\s*\(\s*city\s*\)/i.test(serverCode) ||
          /city/i.test(serverCode),
      },
      {
        label: "Uses fetch(...) to call weather API",
        ok: /fetch\s*\(/i.test(serverCode),
      },
      {
        label: "Checks weather API response status",
        ok:
          /weatherResponse\.ok/i.test(serverCode) ||
          /geoResponse\.ok/i.test(serverCode) ||
          /!\s*\w+Response\.ok/i.test(serverCode) ||
          /Error from weather API/i.test(serverCode) ||
          /Error from geocoding API/i.test(serverCode),
      },
      {
        label: "Parses JSON from weather API",
        ok:
          /\.json\s*\(/i.test(serverCode) &&
          /await/i.test(serverCode),
      },
      {
        label: "Returns some structured weather response",
        ok:
          /raw\s*:/i.test(serverCode) &&
          /res\.json\s*\(\s*\{/i.test(serverCode),
      },
      {
        label: "Has weather error handling",
        ok:
          /Server error during weather fetch/i.test(serverCode) ||
          /Weather fetch error:/i.test(serverCode) ||
          /catch\s*\(\s*err\s*\)/i.test(serverCode),
      },
    ];

    addResult(task, required);
  }
}

/* -----------------------------
   Final scoring
-------------------------------- */
const stepsScore = results.reduce((sum, r) => sum + r.score, 0);
const totalScore = round2(stepsScore + submissionScore);

/* -----------------------------
   Build summary + feedback
-------------------------------- */
const LAB_NAME = "8-1-Thirdparty-API-Authentication-Password-Hasing";

const submissionLine = `- **Lab:** ${LAB_NAME}
- **Deadline (Riyadh / UTC+03:00):** ${DEADLINE_RIYADH_ISO}
- **Last commit time (from git log):** ${lastCommitISO}
- **Submission marks:** **${submissionScore}/${SUBMISSION_MAX}** ${isLate ? "(Late submission)" : "(On time)"}
`;

let summary = `# ${LAB_NAME} — Autograding Summary

## Submission

${submissionLine}

## Files Checked

- Repo root (cwd): ${REPO_ROOT}
- Grader directory: ${GRADER_DIR}
- Detected project root: ${PROJECT_ROOT}
- server.js: ${existsFile(serverFile) ? `✅ ${serverFile}` : "❌ server.js not found"}

## Marks Breakdown

| Component | Marks |
|---|---:|
`;

for (const r of results) summary += `| ${r.name} | ${r.score}/${r.max} |\n`;
summary += `| Submission (timing) | ${submissionScore}/${SUBMISSION_MAX} |\n`;

summary += `
## Total Marks

**${totalScore} / ${TOTAL_MAX}**

## Detailed Checks (What you did / missed)
`;

for (const r of results) {
  const done = (r.checklist || []).filter((x) => x.startsWith("✅"));
  const missed = (r.checklist || []).filter((x) => x.startsWith("❌"));

  summary += `
<details>
  <summary><strong>${mdEscape(r.name)}</strong> — ${r.score}/${r.max}</summary>

  <br/>

  <strong>✅ Found</strong>
  ${done.length ? "\n" + done.map((x) => `- ${mdEscape(x)}`).join("\n") : "\n- (Nothing detected)"}

  <br/><br/>

  <strong>❌ Missing</strong>
  ${missed.length ? "\n" + missed.map((x) => `- ${mdEscape(x)}`).join("\n") : "\n- (Nothing missing)"}

  <br/><br/>

  <strong>❗ Deductions / Notes</strong>
  ${
    r.deductions && r.deductions.length
      ? "\n" + r.deductions.map((d) => `- ${mdEscape(d)}`).join("\n")
      : "\n- No deductions."
  }

</details>
`;
}

summary += `
> Full feedback is also available in: \`artifacts/feedback/README.md\`
`;

let feedback = `# ${LAB_NAME} — Feedback

## Submission

${submissionLine}

## Files Checked

- Repo root (cwd): ${REPO_ROOT}
- Grader directory: ${GRADER_DIR}
- Detected project root: ${PROJECT_ROOT}
- server.js: ${existsFile(serverFile) ? `✅ ${serverFile}` : "❌ server.js not found"}

---

## TODO-by-TODO Feedback
`;

for (const r of results) {
  feedback += `
### ${r.name} — **${r.score}/${r.max}**

**Checklist**
${r.checklist.length ? r.checklist.map((x) => `- ${x}`).join("\n") : "- (No checks available)"}

**Deductions / Notes**
${r.deductions.length ? r.deductions.map((d) => `- ❗ ${d}`).join("\n") : "- ✅ No deductions. Good job!"}
`;
}

feedback += `
---

## How marks were deducted (rules)

- JS comments are ignored, so starter TODO comments do NOT count.
- The grader checks only \`server.js\`.
- Manual Postman testing is NOT graded.
- npm install commands and setup instructions are NOT graded.
- Checks are intentionally lenient and verify top-level implementation only.
- Code can be in ANY order; repeated code is allowed.
- Common equivalents are accepted where possible.
- Missing required items reduce marks proportionally within that TODO.
- Exact formatting is not required as long as the core coding logic is present.
- For the weather TODO, any reasonable public weather/geocoding API structure is accepted.
`;

/* -----------------------------
   Write outputs
-------------------------------- */
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}

const csv = `student,score,max_score
all_students,${totalScore},${TOTAL_MAX}
`;

fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
fs.writeFileSync(path.join(ARTIFACTS_DIR, "grade.csv"), csv);
fs.writeFileSync(path.join(FEEDBACK_DIR, "README.md"), feedback);

console.log(
  `✔ Lab graded: ${totalScore}/${TOTAL_MAX} (Submission: ${submissionScore}/${SUBMISSION_MAX}, TODOs: ${stepsScore}/${STEPS_MAX}).`
);