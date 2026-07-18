# AlManagement

Premium desktop-first asset and investment management platform.

## Tech Stack

**Frontend:** React · TypeScript · Vite · Tailwind CSS · Zustand · React Router · TanStack Table · Lucide Icons

**Backend:** Node.js · Express · SQLite (better-sqlite3)

**Utilities:** dayjs · clsx · zod · react-hook-form

## Project Structure

```
AlManagement/
├── frontend/          # React + TypeScript (src/ lives here at root level)
│   src/
│   ├── components/    # Reusable UI components
│   ├── hooks/         # Custom React hooks
│   ├── layouts/       # App layout (Sidebar, Header, AIPanel)
│   ├── modules/       # Feature-level components
│   ├── pages/         # Route-level pages
│   ├── routes/        # React Router configuration
│   ├── services/      # API client layer
│   ├── store/         # Zustand stores
│   ├── styles/        # Global CSS + tokens
│   ├── types/         # TypeScript types
│   └── utils/         # Utility functions
├── backend/
│   └── src/
│       ├── api/           # API layer
│       ├── controllers/   # Route controllers
│       ├── database/      # SQLite init + connection
│       ├── middleware/     # Express middleware
│       ├── models/        # Data models
│       ├── routes/        # Express routes
│       ├── services/      # Business logic
│       └── utils/         # Helpers
├── database/          # SQLite .db files (gitignored)
├── storage/           # Uploaded files (gitignored)
│   ├── assets/
│   ├── documents/
│   ├── photos/
│   ├── reports/
│   └── temp/
├── docs/              # Documentation
│   └── PRD/           # Product requirements
└── shared/            # Shared types/constants
```

## Getting Started

### Frontend

```bash
npm install
npm run dev
```

Runs on `http://localhost:5173`

### Backend

```bash
cd backend
npm install
npm run dev
```

Runs on `http://localhost:3001`

API health check: `GET http://localhost:3001/api/health`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server |
| `npm run build` | Build frontend for production |
| `npm run lint` | Run ESLint |
| `cd backend && npm run dev` | Start backend dev server |

## Sidebar Navigation

- **Dashboard** — Overview metrics
- **Varlıklar** — Asset management
- **Operasyon**
  - Satınalma
  - Satışlar
  - Müşteriler
  - Finans
  - Masraflar
  - Dokümanlar
- **Raporlar** — Reporting
- **Ayarlar** — Settings

## Storage Policy

All uploaded files (images, PDFs, documents) are stored in the `storage/` folder. SQLite only stores file paths — never binary data.

## Theme

Default: **Dark**. Toggle available in header. Theme preference is persisted via localStorage.
