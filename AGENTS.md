# AGENTS.md

HormiWatch is a time-tracking app split into two independent Node projects. There is no root package/workspace: run commands inside `backend/` or `frontend/hourglass-hub/`.

## Layout / entrypoints

- `backend/` — NestJS 11 + TypeORM, PostgreSQL. Entry `src/main.ts`; wiring `src/app.module.ts`; DB/migrations `src/typeorm.config.ts` + `src/migrations/`.
- `frontend/hourglass-hub/` — Vite + React 18 + TypeScript + shadcn/Tailwind. Entry `src/main.tsx`; routes/role guards `src/App.tsx`; all HTTP calls `src/lib/api.ts`.
- Root `Dockerfile` and `nixpacks.toml` deploy the **backend only**. Frontend ships via `frontend/hourglass-hub/vercel.json` or its own Dockerfile/`server.js`.

## Commands

Use npm (both projects have `package-lock.json`; ignore the backend README's pnpm instructions).

Backend, from `backend/`:
- `npm install`
- `npm run start:dev` (watch), `npm run start:prod` (requires `npm run build`)
- `npm run build`
- `npm test`; single file: `npm test -- common/hashing/hashing.service.spec.ts --runInBand`
- `npm run test:e2e` — boots `AppModule`, needs real DB/env; not a self-contained suite.
- `npm run migrate:run`; generate: `npm run migrate:generate -- src/migrations/Name`
- `npm run seed:services` (seeds service catalogs directly via `DB_URL`)
- `npm run lint` runs ESLint with `--fix` (it mutates files); `npm run format` is Prettier.

Frontend, from `frontend/hourglass-hub/`:
- `npm install`
- `npm run dev` (Vite on port 8080, not 5173)
- `npm run build` — Vite only; it does **not** typecheck
- `npm run lint`
- `npm run start` serves an existing `dist/` through Express on port 3001; build first.

## Backend specifics

- API is under `/api/v1` (global prefix `api` + URI version `1`); Swagger UI is `/api/docs`.
- `JwtAuthGuard` is global in `app.module.ts`: every route is protected unless annotated `@SkipAuth()`.
- PostgreSQL only, configured through `DB_URL` (`synchronize: false`). `DB_HOST`, `DB_NAME`, `DB_USER`, etc. are unused by the running app.
- Required env: `SECRET_KEY` (thrown if missing) and `DB_URL`; see `backend/.env.example` for SMTP, Supabase, timezone, WhatsApp, CORS options. `CORS_ORIGINS` defaults to known Vercel/localhost origins; any `*.vercel.app` origin is allowed.
- Roles in the DB are normally capitalized (`Admin`, `Manager`, `Technician`, `Leader`) while `Role` enum values are lowercase. Public registration always resolves/creates the Technician role.
- `StorageService` is a mock: uploads return fake `example.com` URLs and are not persisted. The frontend Supabase client is optional and inert without `VITE_SUPABASE_*`.
- Notifications: WhatsApp defaults to `mock` (`WHATSAPP_PROVIDER=meta` to use Meta); daily digest cron uses `APP_TIMEZONE` (default `America/Caracas`). Email digest is gated on the email channel being enabled.
- Soft delete/restore exists for users and projects; check `deletedAt` before assuming a row is gone.
- Module internals are inconsistent: some domains use `controllers/` and `services/` subfolders, others keep controller/service at module root.

## Frontend specifics

- API base comes from `VITE_API_URL`, defaulting to `http://localhost:3000/api/v1`.
- Auth keeps the access token in memory and the refresh token in an HttpOnly cookie; `src/lib/api.ts` retries once after `/auth/refresh` on 401. Backend CORS/cookie settings must match.
- Routing uses `HashRouter` (`#/...`). Dashboard redirects and role guards in `src/App.tsx` compare capitalized role strings.
- Do not add `manualChunks` to `vite.config.ts`; it is intentionally disabled due to documented CJS chunk breakage. Route splitting is done with `React.lazy`.

## Gotchas

- `backend/context/*.md` is partly stale (claims MySQL, pnpm, and no migrations). Trust `package.json`, `src/app.module.ts`, and `src/typeorm.config.ts` instead.
- `backend/({` and ``backend/toast.error(`Error`` are accidental zero-byte tracked files; do not copy or extend this pattern.
- There are no CI workflows; verification is local builds/tests.
