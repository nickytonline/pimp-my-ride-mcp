# Repository Guidelines

## Project Structure & Module Organization
Sources live under `src/`, grouped by concern: `auth/` handles identity headers, `tools/` exposes MCP tools, `storage/` provides KV adapters, and `lib/` holds shared helpers. Domain schemas sit in `src/domain/models.ts`, while runtime wiring stays in `src/index.ts`. SQLite data resides in `data/` (never commit), and builds emit to `dist/` via Vite. Place Vitest specs beside code as `*.test.ts`.

## Build, Test, and Development Commands
Use `npm run dev` for a watch-mode MCP server with on-the-fly type stripping. Ship with `npm run build`, then confirm production behavior through `npm start`. Run `npm test` for interactive Vitest, or `npm run test:ci` to produce `test-results.json`. Lint and format with `npm run lint`, `npm run lint:fix`, `npm run format`, and `npm run format:check`.

## Coding Style & Naming Conventions
Write TypeScript ES modules with 2-space indentation and named exports for reusable helpers. Adopt camelCase for functions, keys, and env flags, while MCP tool identifiers stay snake_case (e.g., `get_current_build`). Keep schema updates centralized in `src/domain/models.ts`. Always apply Prettier and ESLint via the provided scripts before submitting reviews.

## Testing Guidelines
Vitest is the test runner; co-locate specs next to implementations as `feature.test.ts`. Mock storage via interfaces in `src/storage/` to cover KV adapters and error paths. Target scenarios around tool registration, domain validation, and invalid payload handling. Prefer `npm run test:ci` ahead of pushes to ensure deterministic artifacts.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`feat(storage): ...`, `fix: ...`) and keep changes focused. Document how to exercise the change, link tracking issues, and include screenshots or MCP transcripts for behavioral updates. Call out config or migration steps so deployers can update `.env` and data stores safely. Ensure tests and linting pass locally before opening a PR.

## Configuration & Security Tips
Declare new environment toggles in `src/config.ts` and document them in `README.md`. Validate defaults with Zod so misconfiguration fails fast. Treat `data/` as sensitive; scrub user content from fixtures and keep SQLite files out of commits.
