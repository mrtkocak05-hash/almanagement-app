# Changelog

All notable changes to AlManagement will be documented in this file.

## [Unreleased]

## [0.1.0] - Sprint 0 Foundation

### Added
- Project scaffolding with Vite + React + TypeScript
- Tailwind CSS with dark/light theme system and color tokens
- Zustand stores: `themeStore`, `uiStore`
- App layout: collapsible Sidebar, Header, AI Panel placeholder
- React Router v6 with all navigation routes
- Placeholder pages: Dashboard, Varlıklar, Satınalma, Satışlar, Müşteriler, Finans, Masraflar, Dokümanlar, Raporlar, Ayarlar
- Reusable UI components: Button, Card, Input, Textarea, Badge, Modal, Loading, EmptyState, PageHeader, StatCard, MetricCard, InfoCard, Table
- Express backend with CORS, Helmet, Morgan
- SQLite database initialization with WAL mode + foreign key support
- Storage folder structure for files (assets, documents, photos, reports, temp)
- ESLint + Prettier configuration
- TypeScript strict mode
- `.gitignore` covering node_modules, .env files, SQLite DB files, uploaded storage files
- README, CHANGELOG, ROADMAP documentation
