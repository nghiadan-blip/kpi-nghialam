# CBCC Management & Scoring Web Application (UBND xã Nghĩa Lâm)

Applications for managing commune civil servants (CBCC), task assignments, and monthly evaluations according to Decree 335/2025/NĐ-CP.

## Monorepo Architecture

- **`client/`**: Vite + React + TypeScript + Tailwind CSS Single Page Application
- **`server/`**: Express + TypeScript + SQLite (via Knex.js) RESTful API Server

## Setup & Running Instructions

```bash
# 1. Install dependencies
npm install

# 2. Run Database Migrations (SQLite)
npm run db:migrate

# 3. Seed Database
npm run db:seed

# 4. Build both client and server
npm run build

# 5. Lint both client and server
npm run lint

# 6. Run Development Mode
npm run dev
```
