# 🔁 LeetLoop

> **Spaced-repetition DSA practice — study smarter, not harder.**
<img width="1920" height="1080" alt="Screenshot from 2026-06-08 23-04-45" src="https://github.com/user-attachments/assets/b2bfdad8-e78e-42aa-8af2-d2feb11e7355" />

LeetLoop is a full-stack web app that helps you master Data Structures & Algorithms using a spaced-repetition system (SRS). Log your attempts, track your progress across popular problem series, get AI-powered hints, and let the scheduler automatically tell you which problems to revisit and when.

---

## ✨ Features

- **Spaced-Repetition Scheduler** — automatically calculates your next review date based on how well you solved a problem (score 0–3), using a custom interval table that blends your current and historical performance.
- **AI Hints & Evaluation** (powered by Gemini 2.5 Flash)
  - Progressive hints (up to 3) that reveal more detail each time without giving away the solution.
  - Automatic solution evaluation — paste your code and get a score, complexity analysis, and improvement suggestions.
- **Multi-Series Support** — choose from three curated problem series:
  - 🚀 **NeetCode 150 / 250**
  - 🔥 **Striver SDE Sheet**
  - 👁️ **Blind 75**
- **Problem Search** — hybrid search that checks the local series index first (works offline & covers premium problems) and falls back to LeetCode's GraphQL API.
- **User Accounts** — JWT-based auth so your progress is stored server-side and syncs across devices.
- **Dark / Light Theme** — fully themed UI with a clean dark mode by default.

---

## 🗂️ Project Structure

```
leetloop/
├── client/          # React + Vite frontend
│   └── src/
│       ├── pages/   # Dashboard, AllProblems, ProblemDetail, Series, Settings, Login
│       ├── components/
│       ├── context/ # ThemeContext, AppDataContext
│       ├── data/    # seriesData.js — all problem lists (NeetCode, Blind75, Striver)
│       ├── hooks/
│       └── api/
│
└── server/          # Node.js + Express backend
    ├── index.js     # Entry point, route registration
    ├── ai.js        # Gemini hint generator & solution evaluator
    ├── scheduler.js # Pure SRS logic (scoring, intervals, effective score)
    ├── db.js        # SQLite (better-sqlite3) setup & queries
    ├── proxy.js     # LeetCode GraphQL proxy for search fallback
    ├── problemsIndex.js  # Local fast-search index for series problems
    ├── middleware/
    │   └── auth.js  # JWT authentication middleware
    └── routes/
        ├── auth.js, problems.js, attempts.js
        ├── progress.js, queue.js, ai.js
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A free [Gemini API key](https://aistudio.google.com) *(optional — app works without it)*

### 1. Clone the repo

```bash
git clone https://github.com/your-username/leetloop.git
cd leetloop
```

### 2. Configure the server environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here   # optional
PORT=3001
JWT_SECRET=any_long_random_string_here
LEETCODE_GRAPHQL_URL=https://leetcode.com/graphql
```

> **Without a Gemini key:** The app runs fully — hints and AI evaluation are simply skipped. Scores are computed from hint count alone. You can add the key any time.

### 3. Install dependencies

```bash
# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### 4. Run the app

Open **two terminals**:

```bash
# Terminal 1 — Backend (http://localhost:3001)
cd server
npm run dev
```

```bash
# Terminal 2 — Frontend (http://localhost:5173)
cd client
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## ⚙️ How the SRS Scoring Works

Each attempt is scored 0–3 based on approach type and hints used:

| Score | Meaning |
|-------|---------|
| **3** | Optimal solution, no hints |
| **2** | 1 hint used *or* clean brute-force with no hints |
| **1** | 2 hints used or shaky understanding |
| **0** | Didn't solve / 3+ hints |

The scheduler blends your current score with your historical effective score to compute the next review interval:

| Score | Review intervals (attempt 1 → 4+) |
|-------|----------------------------------|
| 3 | 14 → 30 → 60 → 120 days |
| 2 | 7 → 14 → 28 → 60 days |
| 1 | 3 → 7 → 14 → 28 days |
| 0 | 1 → 1 → 1 → 1 day |

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router v7, Vite 8, TailwindCSS v4 |
| Backend | Node.js, Express 4 |
| Database | SQLite via `better-sqlite3` |
| AI | Google Gemini 2.5 Flash (`@google/generative-ai`) |
| Auth | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) |

---

## 📸 Pages

| Route | Description |
|-------|-------------|
| `/` | **Dashboard** — today's review queue and overall stats |
| `/problems` | **All Problems** — searchable list of every problem you've added |
| `/problems/:id` | **Problem Detail** — attempt a problem, get hints, submit solutions |
| `/series` | **Series** — browse and join NeetCode / Blind75 / Striver problem sets |
| `/settings` | **Settings** — manage your account and preferences |

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | No | Enables AI hints and solution evaluation |
| `PORT` | No | Server port (default: `3001`) |
| `JWT_SECRET` | **Yes** | Secret key for signing JWTs — use a long random string |
| `LEETCODE_GRAPHQL_URL` | No | LeetCode GraphQL endpoint for search fallback |

---

## 🛠️ Development Scripts

```bash
# Backend
npm run dev    # Start with nodemon (auto-restarts on changes)
npm start      # Start without nodemon

# Frontend
npm run dev    # Vite dev server with HMR
npm run build  # Production build → client/dist/
npm run lint   # ESLint check
```

---

## 📄 License

MIT
