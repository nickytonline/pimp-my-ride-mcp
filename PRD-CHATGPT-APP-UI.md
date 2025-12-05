# PRD: Adding ChatGPT App UI to Pimp My Ride MCP Server

## Summary

Transform the MCP server into a ChatGPT App with UI widgets. Each tool returns text + UI metadata. Widgets are React components bundled via Vite as ESM modules.

---

## Phases Overview

| Phase       | Scope                                            | Status   |
| ----------- | ------------------------------------------------ | -------- |
| **Phase 1** | Infrastructure + stub widgets with red borders   | This PRD |
| **Phase 2** | Interactive widgets (`window.openai.callTool()`) | Future   |
| **Phase 3** | Polished UI with car assets                      | Future   |

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
  filename: string; // e.g., "car-build-card.js"
  invoking: string; // Loading message
  invoked: string; // Completion message
}

export function createWidgetMeta(
  widget: WidgetDescriptor,
  baseUrl: string,
): Record<string, unknown>;
```

#### Task 6: Create `src/lib/ui/response.ts`

UI-aware response creator:

```typescript
export function createUIResult(
  data: unknown,
  textSummary: string,
  widget: WidgetDescriptor,
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
WIDGET_BASE_URL: z.string().url().default("http://localhost:3000/widgets");
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

| Tool                        | Widget         | Text Summary                              |
| --------------------------- | -------------- | ----------------------------------------- |
| `get_current_build`         | `carBuildCard` | "Your {color} build with {wheels} wheels" |
| `update_car_config`         | `carBuildCard` | "Updated your build: {changes}"           |
| `update_driver_profile`     | `carBuildCard` | "Driver profile updated to {persona}"     |
| `save_build`                | `carBuildCard` | "Build saved as '{name}'"                 |
| `load_build`                | `carBuildCard` | "Loaded build '{name}'"                   |
| `list_builds`               | `buildList`    | "Found {count} saved builds"              |
| `delete_build`              | (text only)    | "Deleted build {id}"                      |
| `get_build_details`         | `carBuildCard` | "Build details for '{name}'"              |
| `get_customization_options` | `optionsGrid`  | "Available customization options"         |
| `get_persona_info`          | `personaCard`  | "Driver persona: {name}"                  |

---

## Response Format Example

**Before (current):**

```json
{
  "content": [{ "type": "text", "text": "{\"id\":\"abc\",\"car\":{...}}" }]
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
    "openai/outputTemplate": "ui://widget/car-build-card",
    "openai/toolInvocation/invoking": "Loading your car build...",
    "openai/toolInvocation/invoked": "Here's your customized ride!",
    "openai/widgetAccessible": true,
    "openai/resultCanProduceWidget": true
  }
}
```

**CRITICAL**: The `openai/outputTemplate` must use a `ui://` URI that matches a registered MCP resource, NOT an HTTP URL.

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

## Critical Implementation Details (Lessons Learned)

### 1. Widget Templates Must Use `ui://` URIs

**WRONG:**

```typescript
"openai/outputTemplate": "http://localhost:3000/widgets/car-build-card.js"
```

**CORRECT:**

```typescript
"openai/outputTemplate": "ui://widget/car-build-card"
```

The `ui://` URI references a registered MCP resource, not a direct HTTP URL.

### 2. Widgets Must Be Registered as MCP Resources

Each widget must be registered using `server.registerResource()` with:

- **URI**: `ui://widget/{widget-name}` (matches the outputTemplate)
- **MIME Type**: `text/html+skybridge` (tells ChatGPT it's a widget template)
- **Content**: HTML that loads the JavaScript bundles

Example:

```typescript
server.registerResource(
  "car_build_card",
  "ui://widget/car-build-card",
  {
    title: "Car Build Card widget",
    description: "HTML template for car_build_card",
  },
  async () => {
    const template = await readFile(
      "dist/widgets/templates/car-build-card.html",
      "utf-8",
    );
    return {
      contents: [
        {
          uri: "ui://widget/car-build-card",
          mimeType: "text/html+skybridge",
          text: template.replace(/\{\{BASE_URL\}\}/g, config.WIDGET_BASE_URL),
        },
      ],
    };
  },
);
```

### 3. HTML Template Wrappers Are Required

Widgets can't be served as raw JavaScript bundles. They need HTML wrappers:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body {
        margin: 0;
        padding: 16px;
        font-family:
          -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      #root {
        width: 100%;
        height: 100%;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="{{BASE_URL}}/widgets/vendor.js"></script>
    <script type="module" src="{{BASE_URL}}/widgets/car-build-card.js"></script>
  </body>
</html>
```

The `{{BASE_URL}}` placeholder is replaced at runtime with the `WIDGET_BASE_URL` config value.

### 4. Build Process Must Copy Templates

Add to your Vite server config:

```typescript
import { viteStaticCopy } from "vite-plugin-static-copy";

plugins: [
  viteStaticCopy({
    targets: [
      {
        src: "src/widgets/templates/*.html",
        dest: "widgets/templates",
      },
    ],
  }),
],
```

### 5. Widget Bundles Still Need Static Serving

Even though the HTML templates reference the JS bundles via HTTP URLs, you still need:

```typescript
app.use(
  "/widgets",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  },
  express.static("dist/widgets"),
);
```

### 6. Updated WidgetDescriptor Interface

```typescript
export interface WidgetDescriptor {
  id: string; // e.g., "car_build_card"
  uri: string; // e.g., "ui://widget/car-build-card"
  templateFile: string; // e.g., "car-build-card.html"
  invoking: string; // Loading message
  invoked: string; // Completion message
}
```

### 7. Data Flow

```
Tool Call
  ↓
Tool returns structuredContent + _meta["openai/outputTemplate"] = "ui://widget/car-build-card"
  ↓
ChatGPT requests MCP resource "ui://widget/car-build-card"
  ↓
MCP server returns HTML with mimeType="text/html+skybridge"
  ↓
HTML loads via <script> tags: vendor.js + car-build-card.js from http://your-server/widgets/
  ↓
Widget renders in iframe, accesses structuredContent via window.openai.toolOutput
```

### 8. High-Level MCP Server (McpServer)

- The server uses the SDK's `McpServer` class (not a custom wrapper) so tools and resources automatically expose `_meta`, `structuredContent`, and `text/html+skybridge` resources through the standard request handlers.
- Resource metadata is generated via `createWidgetResourceMeta` to set `openai/widgetDomain`, CSP (`connect_domains`, `resource_domains`), and border preference in a single place.

---

## Files to Create/Modify

### New Files

- `vite.widgets.config.ts`
- `src/lib/ui/widget-meta.ts`
- `src/lib/ui/response.ts`
- `src/widgets/registry.ts`
- `src/widgets/shared/types.ts`
- `src/widgets/templates/car-build-card.html` ⭐ **NEW (Critical)**
- `src/widgets/templates/build-list.html` ⭐ **NEW (Critical)**
- `src/widgets/templates/persona-card.html` ⭐ **NEW (Critical)**
- `src/widgets/templates/options-grid.html` ⭐ **NEW (Critical)**
- `src/widgets/car-build-card/index.tsx`
- `src/widgets/car-build-card/CarBuildCard.tsx`
- `src/widgets/build-list/index.tsx`
- `src/widgets/build-list/BuildList.tsx`
- `src/widgets/persona-card/index.tsx`
- `src/widgets/persona-card/PersonaCard.tsx`
- `src/widgets/options-grid/index.tsx`
- `src/widgets/options-grid/OptionsGrid.tsx`

### Modified Files

- `package.json` (dependencies + scripts + vite-plugin-static-copy)
- `src/config.ts` (add `WIDGET_BASE_URL`)
- `src/index.ts` (add MCP resource registration + static serving + update tool responses)
- `vite.config.ts` (add vite-plugin-static-copy for template copying)
- `tsconfig.json` (add JSX support if needed)

---

## Success Criteria for Phase 1

1. `npm run build` produces both server and widget bundles
2. `/widgets/*.js` endpoints serve widget bundles
3. All tools return `content`, `structuredContent`, and `_meta`
4. Widgets render in ChatGPT with red borders showing data
5. Text summaries appear in conversation transcript

---

---

## Step-by-Step Implementation Guide for Your Own ChatGPT App

Follow this guide to add UI widgets to any MCP server:

### Step 1: Set Up Widget Infrastructure

1. **Install dependencies:**

   ```bash
   npm install react react-dom
   npm install -D @vitejs/plugin-react @types/react @types/react-dom vite-plugin-static-copy
   ```

2. **Create widget Vite config** (`vite.widgets.config.ts`):

   ```typescript
   import { defineConfig } from "vite";
   import react from "@vitejs/plugin-react";
   import { resolve } from "path";

   const widgetEntries = {
     "my-widget": resolve(__dirname, "src/widgets/my-widget/index.tsx"),
   };

   export default defineConfig({
     plugins: [react()],
     build: {
       outDir: "dist/widgets",
       rollupOptions: {
         input: widgetEntries,
         output: {
           format: "es",
           entryFileNames: "[name].js",
           chunkFileNames: "vendor.js",
         },
       },
       cssCodeSplit: false,
       minify: true,
     },
   });
   ```

3. **Update main Vite config** to copy HTML templates:

   ```typescript
   import { viteStaticCopy } from "vite-plugin-static-copy";

   plugins: [
     viteStaticCopy({
       targets: [
         { src: "src/widgets/templates/*.html", dest: "widgets/templates" },
       ],
     }),
   ],
   ```

4. **Update package.json scripts:**
   ```json
   {
     "scripts": {
       "build": "npm run build:server && npm run build:widgets",
       "build:server": "vite build",
       "build:widgets": "vite build --config vite.widgets.config.ts"
     }
   }
   ```

### Step 2: Create Widget Infrastructure Files

1. **Widget registry** (`src/widgets/registry.ts`):

   ```typescript
   export const WIDGETS = {
     myWidget: {
       id: "my_widget",
       uri: "ui://widget/my-widget",
       templateFile: "my-widget.html",
       invoking: "Loading...",
       invoked: "Done!",
     },
   };
   ```

2. **Widget metadata helper** (`src/lib/ui/widget-meta.ts`):

   ```typescript
   export interface WidgetDescriptor {
     id: string;
     uri: string;
     templateFile: string;
     invoking: string;
     invoked: string;
   }

   export function createWidgetMeta(widget: WidgetDescriptor) {
     return {
       "openai/outputTemplate": widget.uri,
       "openai/toolInvocation/invoking": widget.invoking,
       "openai/toolInvocation/invoked": widget.invoked,
       "openai/widgetAccessible": true,
       "openai/resultCanProduceWidget": true,
     };
   }
   ```

3. **UI result helper** (`src/lib/ui/response.ts`):

   ```typescript
   import { createWidgetMeta } from "./widget-meta";

   export function createUIResult(
     data: unknown,
     textSummary: string,
     widget: WidgetDescriptor,
   ) {
     return {
       content: [{ type: "text", text: textSummary }],
       structuredContent: data,
       _meta: createWidgetMeta(widget),
     };
   }
   ```

### Step 3: Create HTML Template

Create `src/widgets/templates/my-widget.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body {
        margin: 0;
        padding: 16px;
      }
      #root {
        width: 100%;
        height: 100%;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="{{BASE_URL}}/widgets/vendor.js"></script>
    <script type="module" src="{{BASE_URL}}/widgets/my-widget.js"></script>
  </body>
</html>
```

### Step 4: Create React Widget

1. **Widget component** (`src/widgets/my-widget/MyWidget.tsx`):

   ```typescript
   import React from "react";

   export function MyWidget() {
     // Access data from tool response
     const data = (window as any).openai?.toolOutput;

     return (
       <div style={{ border: "3px solid red", padding: "16px" }}>
         <h2>My Widget</h2>
         <pre>{JSON.stringify(data, null, 2)}</pre>
       </div>
     );
   }
   ```

2. **Widget entry point** (`src/widgets/my-widget/index.tsx`):

   ```typescript
   import { createRoot } from "react-dom/client";
   import { MyWidget } from "./MyWidget";

   let container = document.getElementById("root");
   if (!container) {
     container = document.createElement("div");
     container.id = "root";
     document.body.appendChild(container);
   }

   createRoot(container).render(<MyWidget />);
   ```

### Step 5: Register MCP Resources

In your `src/index.ts`, add resource registration:

```typescript
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { WIDGETS } from "./widgets/registry";

const getServer = (req: express.Request) => {
  const server = new McpServer({ ... });

  // Register widget resources
  Object.values(WIDGETS).forEach((widget) => {
    server.registerResource(
      widget.id,
      widget.uri,
      {
        title: `${widget.id} widget`,
        description: `HTML template for ${widget.id}`,
      },
      async () => {
        const templatePath = join(__dirname, "widgets", "templates", widget.templateFile);
        let template = await readFile(templatePath, "utf-8");
        template = template.replace(/\{\{BASE_URL\}\}/g, config.WIDGET_BASE_URL);

        return {
          contents: [{
            uri: widget.uri,
            mimeType: "text/html+skybridge",
            text: template,
          }],
        };
      }
    );
  });

  // Register tools...
  server.registerTool("my_tool", schema, async (args) => {
    const result = { message: "Hello!" };
    return createUIResult(result, "Tool executed", WIDGETS.myWidget);
  });

  return server;
};
```

### Step 6: Serve Widget Bundles

Add static serving in your Express app:

```typescript
app.use(
  "/widgets",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  },
  express.static("dist/widgets"),
);
```

### Step 7: Add Configuration

Add to your `src/config.ts`:

```typescript
WIDGET_BASE_URL: z
  .string()
  .url()
  .default("http://localhost:3000/widgets")
  .transform((url) => url.replace(/\/+$/, "")),
```

### Step 8: Build and Test

```bash
# Build everything
npm run build

# Start server
npm start

# Test widget serving
curl http://localhost:3000/widgets/my-widget.js

# Test in ChatGPT Developer Mode
# Add your MCP server and invoke the tool
```

### Common Pitfalls to Avoid

1. ❌ Using HTTP URLs in `openai/outputTemplate`
   - ✅ Use `ui://widget/{name}` URIs instead

2. ❌ Not registering widgets as MCP resources
   - ✅ Use `server.registerResource()` with `text/html+skybridge`

3. ❌ Pointing directly to JavaScript bundles
   - ✅ Use HTML templates that load the JS bundles

4. ❌ Forgetting CORS headers for widget bundles
   - ✅ Add CORS headers to `/widgets` endpoint

5. ❌ Not replacing `{{BASE_URL}}` in templates
   - ✅ Replace at runtime with your server's public URL

6. ❌ Missing `vendor.js` reference in HTML
   - ✅ Load both vendor.js and widget-specific JS

### Debugging Checklist

- [ ] Widget bundles exist in `dist/widgets/`
- [ ] HTML templates exist in `dist/widgets/templates/`
- [ ] MCP resources registered with correct URIs
- [ ] `openai/outputTemplate` matches resource URI
- [ ] CORS headers set on `/widgets` endpoint
- [ ] `WIDGET_BASE_URL` points to publicly accessible URL
- [ ] Templates load both `vendor.js` and widget JS
- [ ] Browser console shows no CORS or 404 errors

---

## References

- [OpenAI Apps SDK - Build MCP Server](https://developers.openai.com/apps-sdk/build/mcp-server/)
- [OpenAI Apps SDK - Build ChatGPT UI](https://developers.openai.com/apps-sdk/build/chatgpt-ui/)
- [OpenAI Apps SDK Examples - Pizzaz Server](https://github.com/openai/openai-apps-sdk-examples/tree/main/pizzaz_server_node)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Community Forum Discussion](https://community.openai.com/t/ui-not-rendering-when-trying-to-load-widget-using-chatgpt-apps-sdk/1366898)
- [MCP-UI Documentation](https://mcpui.dev/guide/apps-sdk)
