# Repository Guidelines

## Project Structure & Module Organization
- `src/` hosts TypeScript sources by concern: `auth/` handles identity headers, `tools/` exposes MCP tools, `storage/` implements KV adapters, `lib/` shares helpers; `src/index.ts` wires the server.
- SQLite artifacts live in `data/`; clean builds emit to `dist/` via Vite. Commit only source and configuration.
- Runtime options are declared in `src/config.ts`. Extend the Zod schema whenever you add an environment variable so validation fails fast.

## Build, Test, and Development Commands
- `npm run dev` starts the MCP server with watch mode and type stripping—use it for feature work.
- `npm run build` bundles to `dist/`; verify production behavior with `npm start` after building.
- `npm test` runs Vitest in watch mode, while `npm run test:ci` emits `test-results.json` for pipelines.
- `npm run lint` / `lint:fix` enforce ESLint rules, and `npm run format` / `format:check` apply Prettier formatting to `src/**/*.ts`.

## Coding Style & Naming Conventions
- Stick to 2-space indentation, TypeScript ES modules, and named exports for reusable helpers. Tool IDs, data keys, and environment flags use `camelCase`.
- Run Prettier and ESLint before opening a PR, and keep drive-by formatting out of feature branches.
- Schema updates belong in `src/domain/models.ts`; type aliases should live next to the logic they support.

## Testing Guidelines
- Author Vitest specs beside features using the `*.test.ts` suffix (e.g. `src/tools/builds.test.ts`). Mock `KV` via the interfaces in `src/storage/`.
- Target coverage on tool registration, domain validators, and error paths; simulate both valid and invalid payloads.
- Execute `npm run test:ci` locally before pushing to ensure deterministic output for reviewers.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`) as seen in history; include a scope when touching a single module (e.g. `feat(storage): add redis adapter`).
- Keep PRs focused, describe how to exercise the change, and link tracking issues. Attach screenshots or sample MCP transcripts when behavior changes.
- Call out configuration or migration steps in the PR body so deployers can update `.env` and data stores safely.

## Configuration & Security Tips
- Environment defaults are Zod-validated on startup; document additions in `README.md` and update `src/config.ts`.
- SQLite files under `data/` may contain user data—exclude them from commits and scrub sensitive fixtures before sharing.
