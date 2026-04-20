/**
 * =========================================================
 * Lab: SECURE WEATHER DASHBOARD
 * =========================================================
 *
 * ===================================================================
   LAB SETUP INSTRUCTIONS
 * ===================================================================
 * 1) Initialize project and install dependencies:
 *     Run either of these commands:
 *      npm i
 *      OR
 *      npm install
 *      npm install express bcryptjs jsonwebtoken
 *      
 *      If your system blocks running npm commands (especially on Windows PowerShell),
 *           run this command first to allow script execution:
 *           Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
 *
 * 2) JWT SECRET (for this lab):
 *    - In REAL projects, secrets come from .env:
 *        JWT_SECRET=someVerySecretString
 *    - For THIS LAB, we will use a fixed secret in code:
 *        const JWT_SECRET = "abc123";
 *      (Already defined for you below. Do NOT change it so tests pass.)
 *
 * 3) Start the server:
 *      node server.js
 *
 * 4) Health check:
 *    - METHOD: GET
 *      URL:    http://localhost:3000/
 *      EXPECT: text "Server is running"
 *
 * =========================================================
 * HOW TO SEND JSON (VERY IMPORTANT)
 * =========================================================
 * Install the postman from the VS code extension store.
 *
 * =========================================================
 * TODO 1: IMPLEMENT USER REGISTRATION (POST /register)
 * =========================================================
 * WHAT ROUTE TO USE:
 *   - Use POST because we are CREATING a new user resource.
 *   - The route is already defined for you:
 *
 *       app.post("/register", async (req, res) => { ... })
 *
 * WHAT IT MUST DO:
 *   1) Read JSON body:
 *        const { email, password } = req.body || {};
 *   2) Validate required fields:
 *        - If email OR password is missing:
 *            return res.status(400).json({ error: "Email and password are required" });
 *   3) Check if user already exists in the in-memory "users" array:
 *        const existing = users.find((u) => u.email === email);
 *        - If existing is found:
 *            return res.status(400).json({ error: "User already exists" });
 *   4) Hash the password using bcrypt:
 *        const hash = await bcrypt.hash(password, 10);
 *   5) Store the new user:
 *        users.push({ email, passwordHash: hash });
 *   6) Send success response:
 *        return res.status(201).json({ message: "User registered!" });
 *   7) Wrap everything in try/catch; on error:
 *        console.error("Register error:", err);
 *        return res.status(500).json({ error: "Server error during register" });
 *
 * HOW TO TEST /register:
 *   - METHOD: POST
 *   - URL:    http://localhost:3000/register
 *   - Choose Body -> Raw (after GraphQL radio button, there is a drop-down, choose JSON):
 *       {
 *         "email": "student@example.com",
 *         "password": "mypassword123"
 *       }
 *   - EXPECT:
 *       • First time: 201, { "message": "User registered!" }
 *       • Second time with same email: 400, { "error": "User already exists" }
 *
 * =========================================================
 * TODO 2: IMPLEMENT USER LOGIN (POST /login)
 * =========================================================
 * WHAT ROUTE TO USE:
 *   - Use POST because we are SENDING credentials to authenticate.
 *   - The route is:
 *
 *       app.post("/login", async (req, res) => { ... })
 *
 * WHAT IT MUST DO:
 *   1) Read JSON body:
 *        const { email, password } = req.body || {};
 *   2) Validate:
 *        - If missing email OR password:
 *            return res.status(400).json({ error: "Email and password are required" });
 *   3) Find user by email:
 *        const user = users.find((u) => u.email === email);
 *        - If NOT found:
 *            return res.status(400).json({ error: "User not found" });
 *   4) Compare passwords with bcrypt:
 *        const match = await bcrypt.compare(password, user.passwordHash);
 *        - If NOT matched:
 *            return res.status(400).json({ error: "Wrong password" });
 *   5) Create JWT token using secret "abc123":
 *        const token = jwt.sign(
 *          { email },
 *          JWT_SECRET,          // this is "abc123"
 *          { expiresIn: "1h" }
 *        );
 *   6) Return the token:
 *        return res.json({ token });
 *   7) On unexpected error, catch and respond:
 *        console.error("Login error:", err);
 *        return res.status(500).json({ error: "Server error during login" });
 *
 * HOW TO TEST /login:
 *   - Make sure you have already registered the user.
 *   - METHOD: POST
 *   - URL:    http://localhost:3000/login
 *   - Choose Body -> Raw (after GraphQL radio button, there is a drop-down, choose JSON):
 *       {
 *         "email": "student@example.com",
 *         "password": "mypassword123"
 *       }
 *   - EXPECT:
 *       • On success: 200, { "token": "<JWT_STRING>" }
 *       • Wrong email:   400, { "error": "User not found" }
 *       • Wrong password:400, { "error": "Wrong password" }
 *
 * =========================================================
 * TODO 3: IMPLEMENT PROTECTED WEATHER ENDPOINT (GET /weather)
 * =========================================================
 * WHAT ROUTE TO USE:
 *   - Use GET because we are RETRIEVING weather information.
 *   - The route is:
 *
 *       app.get("/weather", async (req, res) => { ... })
 *
 * AUTHENTICATION REQUIREMENT (EXTREMELY IMPORTANT):
 *   This route is PROTECTED by JWT.
 *
 *   The client MUST send a valid token in the `Authorization` header.
 *
 *   ▶ HOW TO ADD AUTHORIZATION IN POSTMAN / THUNDER CLIENT:
 *
 *   1) First, obtain a token by calling the /login endpoint.
 *      Example response:
 *        {
 *          "token": "eyJhbGciOiJIUzI1..."
 *        }
 *
 *   2) Copy the token (the entire long string).
 *
 *   3) Open POSTMAN → go to the **Headers** tab.
 *
 *   4) Add a new header:
 *
 *         KEY:     Authorization
 *         VALUE:   Bearer <paste_your_token_here>
 *
 *      ✔ Example (VALUE field):
 *         Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....
 *
 *      ⚠ DO NOT put quotes around the token.
 *      ⚠ DO NOT remove the word "Bearer".
 *      ⚠ There MUST be ONE SPACE between "Bearer" and the token.
 *
 *   5) Now call the endpoint:
 *
 *         METHOD: GET
 *         URL:    http://localhost:3000/weather?city=Riyadh
 *
 *   6) If your token is valid → you get weather JSON.
 *      If invalid → you get:
 *         401 { "error": "Invalid token" }
 *
 *
 * WHAT THIS ROUTE MUST DO:
 *   1) Read Authorization header:
 *        const auth = req.headers.authorization;
 *        - If missing:
 *            return res.status(401).json({ error: "Missing token" });
 *
 *   2) Extract token:
 *        const token = auth.split(" ")[1];
 *
 *   3) Verify token:
 *        try {
 *          jwt.verify(token, JWT_SECRET);
 *        } catch {
 *          return res.status(401).json({ error: "Invalid token" });
 *        }
 *
 *   4) Read city from query string:
 *        const city = req.query.city;
 *        - If missing:
 *            return res.status(400).json({ error: "City required" });
 *
 *   5) Prepare external weather API URL:
 *        const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
 *
 *   6) Use fetch() to call API:
 *        const weatherResponse = await fetch(url);
 *        if (!weatherResponse.ok) {
 *          return res.status(500).json({ error: "Error from weather API" });
 *        }
 *
 *   7) Parse JSON:
 *        const data = await weatherResponse.json();
 *
 *   8) Return structured weather data:
 *        return res.json({
 *          city,
 *          temp: data.temperature,
 *          description: data.description,
 *          wind: data.wind,
 *          raw: data   // full API response if students want to inspect
 *        });
 *
 *   9) If something crashes inside try block:
 *        return res.status(500).json({ error: "Server error during weather fetch" });
 *
 */

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3000;
const JWT_SECRET = "abc123";

app.use(express.json());

// In-memory "database"
let users = [];

// Simple health check
app.get("/", (_req, res) => {
  res.send("Server is running");
});

// =========================
// POST /register
// =========================
app.post("/register", async (req, res) => {
  // Implement logic here based on the TODO 1.
});

// =========================
// POST /login
// =========================
app.post("/login", async (req, res) => {
  // Implement logic here based on the TODO 2.
});

// =========================
// Protected Weather API
// GET /weather?city=Riyadh
// =========================
app.get("/weather", async (req, res) => {
  // Implement logic here based on the TODO 3.
});

// Start server
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
