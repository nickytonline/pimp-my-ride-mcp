# 🏎️ Pimp My Ride — MCP Server PRD

## Overview

**Project:** Pimp My Ride
**Component:** MCP (Model Context Protocol) Server
**Goal:** Provide a production-ready MCP server that exposes car configuration tools via the MCP interface to demonstrate LLM tool-calling, state persistence, and Pomerium-based authentication.

The MCP server can be used by any application (such as the **Pomeranian Kart** racing game) — demonstrating car configuration and customization integrated with Pomerium for authentication and compatible with ChatGPT, Claude, and other MCP clients.

---

## Objectives

- Enable LLMs and applications to create, update, and manage car builds using natural language commands.
- Support persistent storage (default SQLite) through a clean KV abstraction for easy backend swapping.
- Provide tool endpoints for:
  - Car configuration (color, wheels, decals, body kits, spoilers, etc.)
  - Driver persona selection and updates
  - Build saving/loading
  - Randomized builds and upgrade suggestions
  - (Phase 2) Race simulation and leaderboard integration
- Support Pomerium authentication and identity propagation.

---

## Scope

### In Scope
- Full MCP server implementation using TypeScript (based on `mcp-typescript-template`)
- SQLite-backed KV storage (default, factory pattern)
- Authentication via Pomerium headers
- Defined tool schemas for car configuration and driver profiles
- Clean API boundaries via MCP tool calls

### Out of Scope (Phase 1)
- Leaderboards
- Multiplayer race logic
- Image rendering engine (stubbed with IDs only)
- Advanced auth UI or user management

---

## Architecture

### Stack
- **Language:** TypeScript
- **Framework:** `mcp-typescript-template`
- **Database:** SQLite (default), pluggable KV interface
- **Auth:** Pomerium-proxied requests (headers for identity)
- **Schema Validation:** Zod

### Data Flow
1. User interacts with OpenAI App (frontend).
2. The App’s LLM interprets user intent and calls MCP tools (e.g. `updateCarConfig`).
3. MCP server applies updates via KV storage.
4. Updated build state returned to app for visualization.

### Key Components
- `src/tools/` — all MCP tool definitions
- `src/storage/` — KV interface and SQLite adapter
- `src/domain/` — car config validation and diff utilities
- `src/auth/` — Pomerium header resolution

---

## Data Model

### Car Configuration
Attributes:
- color, secondaryColor
- wheels, bodyKit, decal
- spoiler, exhaust, underglow
- performance (power, grip, aero, weight)

### Driver Profile
- persona (`CoolCalmCollected`, `RoadRage`, etc.)
- nickname
- derived perks

### Storage Layout
- Namespace: `builds`
- Key: `${userId}:${buildId}`
- Value: JSON-encoded `Build` (car + driver)

---

## KV Interface (Storage Abstraction)

### Features
- Namespaces
- TTL support
- CAS versioning
- Pagination via cursor
- JSON helpers

### Default Implementation
- `SQLiteKV` using `better-sqlite3`
- Table schema:
  ```sql
  CREATE TABLE kv (
    ns TEXT, key TEXT, value BLOB, content_type TEXT,
    version INTEGER, expires_at INTEGER, updated_at INTEGER,
    PRIMARY KEY (ns, key)
  );
  ```

### Future Adapters
- RedisKV, PostgresKV, DynamoKV

---

## MCP Tools

| Tool | Purpose |
|------|----------|
| `getCurrentBuild` | Retrieve or create user’s active build |
| `updateCarConfig` | Patch car attributes |
| `updateDriverProfile` | Set driver persona and nickname |
| `saveBuild` | Save active build under a name |
| `loadBuild` | Load saved build |
| `listBuilds` | List all user builds |
| `randomizeBuild` | Generate a random styled build |
| `suggestUpgrades` | Recommend upgrades based on goals |
| `generateLivery` | Suggest color/decal combos |
| `previewSnapshot` | Stub for image preview ID |
| (Phase 2) `simulateRace`, `getLeaderboard` | Race results and rankings |

---

## Identity & Auth

- Trust Pomerium headers: `X-Email`, `X-User`, `X-User-Id`, or JWT claims.
- Derive `userId` from Pomerium subject; fallback to anonymous (dev mode).
- No session storage required.

---

## Error Handling

| Code | Meaning |
|------|----------|
| `VALIDATION` | Input validation failed |
| `UNAUTHORIZED` | Missing or invalid identity |
| `CONFLICT` | Build name or version conflict |
| `NOT_FOUND` | Build not found |
| `RATE_LIMIT` | Too many requests |

---

## Rate Limits

- 60 tool calls/min per user
- 10 preview requests/min

---

## Phase Plan

### Phase 1 – Core Builder
- MCP server skeleton
- SQLiteKV + factory
- Car + Driver tools
- Auth integration

### Phase 2 – Assist & Race
- Randomize, Suggest, Livery tools
- Stub race simulation + leaderboard

### Phase 3 – Public Demo
- Host behind Pomerium
- Collect optional emails via identity
- Integrate leaderboard UI

---

## Success Metrics

- 100% tool schema coverage via Zod
- Sub-100ms tool latency (avg)
- <1% tool error rate under load
- 1000+ unique authenticated users in public demo

---

## References

- OpenAI Apps SDK: [Auth Docs](https://developers.openai.com/apps-sdk/build/auth)
- OpenAI Apps SDK: [Design Guidelines](https://developers.openai.com/apps-sdk/concepts/design-guidelines)
- Pomerium MCP Docs: [https://www.pomerium.com/docs/capabilities/mcp](https://www.pomerium.com/docs/capabilities/mcp)
- MCP TS Template: [https://github.com/nickytonline/mcp-typescript-template](https://github.com/nickytonline/mcp-typescript-template)

---
