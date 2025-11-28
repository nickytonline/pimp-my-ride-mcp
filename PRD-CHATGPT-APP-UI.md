# PRD: Adding ChatGPT App UI to Pimp My Ride MCP Server

## Summary

Transform the MCP server into a ChatGPT App with UI widgets. Each tool returns text + UI metadata. Widgets are React components bundled via Vite as ESM modules.

---

## Phases Overview

| Phase | Scope | Status |
|-------|-------|--------|
| **Phase 1** | Infrastructure + stub widgets with red borders | This PRD |
| **Phase 2** | Interactive widgets (`window.openai.callTool()`) | Future |
| **Phase 3** | Polished UI with car assets | Future |

---

## Architecture

### Directory Structure

```
src/
├── index.ts                    # MCP server (existing)
├── lib/
│   ├── utils.ts               # Existing
│   └── ui/
│       ├── widget-meta.ts     # OpenAI metadata helpers
│       └── response.ts        # UI-aware response creator
├── widgets/                    # React widget source
│   ├── registry.ts            # Widget definitions
│   ├── shared/
│   │   └── types.ts           # Shared TypeScript types
│   ├── car-build-card/
│   │   ├── index.tsx          # Entry point
│   │   └── CarBuildCard.tsx   # Component
│   ├── build-list/
│   │   ├── index.tsx
│   │   └── BuildList.tsx
│   ├── persona-card/
│   │   ├── index.tsx
│   │   └── PersonaCard.tsx
│   └── options-grid/
│       ├── index.tsx
│       └── OptionsGrid.tsx
└── ...

dist/
├── index.js                   # Server bundle
└── widgets/                   # Widget bundles (one per widget)
    ├── car-build-card.js
    ├── build-list.js
    ├── persona-card.js
    └── options-grid.js
```

### Vite Configuration Strategy

**Two Vite configs:**
1. `vite.config.ts` - Server build (existing, unchanged)
2. `vite.widgets.config.ts` - Widget builds (new)

The widget config will:
- Use `@vitejs/plugin-react` for JSX/TSX
- Build multiple entry points (one per widget)
- Output ESM bundles with React inlined
- Inline CSS into the bundle
- Proxy `/mcp` requests to Express during development

### Development Setup

```
Production:
  Express serves both /mcp and /widgets (static)

Development:
  Vite dev server (port 5173) → serves widgets with HMR
    ↓ proxy
  Express (port 3000) → serves /mcp endpoints
```

---

## Implementation Tasks

### Phase 1.1: Vite Widget Infrastructure

#### Task 1: Add React dependencies
```bash
npm install react@19 react-dom@19
npm install -D @vitejs/plugin-react @types/react @types/react-dom
```

#### Task 2: Create `vite.widgets.config.ts`
Multi-entry Vite config for widget bundling:
- Entry: `src/widgets/*/index.tsx`
- Output: `dist/widgets/*.js`
- Format: ESM (required by OpenAI Apps SDK / skybridge)
- React bundled in (widgets run in isolation)
- Dev server with proxy to Express

#### Task 3: Update `package.json` scripts
```json
{
  "scripts": {
    "build": "npm run build:server && npm run build:widgets",
    "build:server": "vite build",
    "build:widgets": "vite build --config vite.widgets.config.ts",
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:widgets\"",
    "dev:server": "node --experimental-strip-types --watch src/index.ts",
    "dev:widgets": "vite --config vite.widgets.config.ts"
  }
}
```

#### Task 4: Add widget static serving in Express
```typescript
// In src/index.ts
app.use("/widgets", express.static("dist/widgets"));
```

---

### Phase 1.2: Widget Metadata Infrastructure

#### Task 5: Create `src/lib/ui/widget-meta.ts`
Helper to generate OpenAI widget metadata:
```typescript
export interface WidgetDescriptor {
  id: string;
  filename: string;      // e.g., "car-build-card.js"
  invoking: string;      // Loading message
  invoked: string;       // Completion message
}

export function createWidgetMeta(
  widget: WidgetDescriptor,
  baseUrl: string
): Record<string, unknown>;
```

#### Task 6: Create `src/lib/ui/response.ts`
UI-aware response creator:
```typescript
export function createUIResult(
  data: unknown,
  textSummary: string,
  widget: WidgetDescriptor
): CallToolResult;
```

#### Task 7: Create `src/widgets/registry.ts`
Central registry of all widgets:
```typescript
export const WIDGETS = {
  carBuildCard: { id: "car_build_card", filename: "car-build-card.js", ... },
  buildList: { id: "build_list", filename: "build-list.js", ... },
  personaCard: { id: "persona_card", filename: "persona-card.js", ... },
  optionsGrid: { id: "options_grid", filename: "options-grid.js", ... },
};
```

#### Task 8: Add `WIDGET_BASE_URL` to config
```typescript
WIDGET_BASE_URL: z.string().url().default("http://localhost:3000/widgets")
```

---

### Phase 1.3: Widget Components (Stub with Red Borders)

Each widget follows the same pattern:
1. `index.tsx` - Mounts React app, accesses `window.openai`
2. `Component.tsx` - Renders data with red border

#### Task 9: Create shared types (`src/widgets/shared/types.ts`)
TypeScript types for widget data (mirrors domain models).

#### Task 10: Create `car-build-card` widget
Displays: color, wheels, bodyKit, spoiler, exhaust, underglow, performance stats, driver persona.
Used by: `get_current_build`, `update_car_config`, `update_driver_profile`, `save_build`, `load_build`, `get_build_details`

#### Task 11: Create `build-list` widget
Displays: list of saved builds with name, date, preview.
Used by: `list_builds`

#### Task 12: Create `persona-card` widget
Displays: persona name, description, strengths, weaknesses.
Used by: `get_persona_info`

#### Task 13: Create `options-grid` widget
Displays: all customization options (colors, wheels, etc.).
Used by: `get_customization_options`

---

### Phase 1.4: Update Tool Responses

#### Task 14: Update `get_current_build`
Return `createUIResult(build, summary, WIDGETS.carBuildCard)`

#### Task 15: Update `update_car_config`
Return `createUIResult(build, summary, WIDGETS.carBuildCard)`

#### Task 16: Update `update_driver_profile`
Return `createUIResult(build, summary, WIDGETS.carBuildCard)`

#### Task 17: Update `save_build`
Return `createUIResult(build, summary, WIDGETS.carBuildCard)`

#### Task 18: Update `load_build`
Return `createUIResult(build, summary, WIDGETS.carBuildCard)`

#### Task 19: Update `list_builds`
Return `createUIResult(result, summary, WIDGETS.buildList)`

#### Task 20: Update `delete_build`
Return `createUIResult({ deleted, buildId }, summary, WIDGETS.carBuildCard)` (or simple text)

#### Task 21: Update `get_build_details`
Return `createUIResult(details, summary, WIDGETS.carBuildCard)`

#### Task 22: Update `get_customization_options`
Return `createUIResult(options, summary, WIDGETS.optionsGrid)`

#### Task 23: Update `get_persona_info`
Return `createUIResult(personaInfo, summary, WIDGETS.personaCard)`

---

### Phase 1.5: Testing & Verification

#### Task 24: Build and verify widget bundles exist
```bash
npm run build:widgets
ls dist/widgets/
```

#### Task 25: Verify widget serving
```bash
curl http://localhost:3000/widgets/car-build-card.js
```

#### Task 26: Test tool responses include `_meta`
Verify JSON structure has `content`, `structuredContent`, and `_meta` fields.

---

## Tool-to-Widget Mapping

| Tool | Widget | Text Summary |
|------|--------|--------------|
| `get_current_build` | `carBuildCard` | "Your {color} build with {wheels} wheels" |
| `update_car_config` | `carBuildCard` | "Updated your build: {changes}" |
| `update_driver_profile` | `carBuildCard` | "Driver profile updated to {persona}" |
| `save_build` | `carBuildCard` | "Build saved as '{name}'" |
| `load_build` | `carBuildCard` | "Loaded build '{name}'" |
| `list_builds` | `buildList` | "Found {count} saved builds" |
| `delete_build` | (text only) | "Deleted build {id}" |
| `get_build_details` | `carBuildCard` | "Build details for '{name}'" |
| `get_customization_options` | `optionsGrid` | "Available customization options" |
| `get_persona_info` | `personaCard` | "Driver persona: {name}" |

---

## Response Format Example

**Before (current):**
```json
{
  "content": [
    { "type": "text", "text": "{\"id\":\"abc\",\"car\":{...}}" }
  ]
}
```

**After (with UI):**
```json
{
  "content": [
    { "type": "text", "text": "Your red build with racing wheels" }
  ],
  "structuredContent": {
    "id": "abc",
    "name": "Speed Demon",
    "car": { "color": "red", "wheels": "racing", ... },
    "driver": { "persona": "SpeedDemon", ... }
  },
  "_meta": {
    "openai/outputTemplate": "https://your-domain.com/widgets/car-build-card.js",
    "openai/toolInvocation/invoking": "Loading your car build...",
    "openai/toolInvocation/invoked": "Here's your customized ride!",
    "openai/widgetAccessible": true,
    "openai/resultCanProduceWidget": true
  }
}
```

---

## Stub Widget Visual (Phase 1)

All widgets render with this pattern for visibility:

```
┌─────────────────────────────────────┐
│  ╔═══════════════════════════════╗  │  ← Red border (3px solid red)
│  ║  CAR BUILD: Speed Demon       ║  │
│  ║                               ║  │
│  ║  Color: red                   ║  │
│  ║  Secondary: black             ║  │
│  ║  Wheels: racing               ║  │
│  ║  Body Kit: sport              ║  │
│  ║  Spoiler: gt_wing             ║  │
│  ║  Exhaust: dual                ║  │
│  ║  Underglow: blue              ║  │
│  ║                               ║  │
│  ║  Performance:                 ║  │
│  ║  Power: ████████░░ 80         ║  │
│  ║  Grip:  ██████░░░░ 60         ║  │
│  ║  Aero:  ███████░░░ 70         ║  │
│  ║  Weight:██████████ 100        ║  │
│  ║                               ║  │
│  ║  Driver: SpeedDemon           ║  │
│  ╚═══════════════════════════════╝  │
└─────────────────────────────────────┘
```

---

## Files to Create/Modify

### New Files
- `vite.widgets.config.ts`
- `src/lib/ui/widget-meta.ts`
- `src/lib/ui/response.ts`
- `src/widgets/registry.ts`
- `src/widgets/shared/types.ts`
- `src/widgets/car-build-card/index.tsx`
- `src/widgets/car-build-card/CarBuildCard.tsx`
- `src/widgets/build-list/index.tsx`
- `src/widgets/build-list/BuildList.tsx`
- `src/widgets/persona-card/index.tsx`
- `src/widgets/persona-card/PersonaCard.tsx`
- `src/widgets/options-grid/index.tsx`
- `src/widgets/options-grid/OptionsGrid.tsx`

### Modified Files
- `package.json` (dependencies + scripts)
- `src/config.ts` (add `WIDGET_BASE_URL`)
- `src/index.ts` (add static serving + update tool responses)
- `tsconfig.json` (add JSX support if needed)

---

## Success Criteria for Phase 1

1. `npm run build` produces both server and widget bundles
2. `/widgets/*.js` endpoints serve widget bundles
3. All tools return `content`, `structuredContent`, and `_meta`
4. Widgets render in ChatGPT with red borders showing data
5. Text summaries appear in conversation transcript

---

## References

- [OpenAI Apps SDK - Build MCP Server](https://developers.openai.com/apps-sdk/build/mcp-server/)
- [OpenAI Apps SDK - Build ChatGPT UI](https://developers.openai.com/apps-sdk/build/chatgpt-ui/)
- [OpenAI Apps SDK Examples - Pizzaz Server](https://github.com/openai/openai-apps-sdk-examples/tree/main/pizzaz_server_node)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
