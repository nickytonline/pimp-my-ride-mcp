# Next Steps: Refactor to Base Server Class for ChatGPT App UI

## Current Status

We've implemented all the infrastructure for ChatGPT App UI:
- ✅ Widget HTML templates with text/html+skybridge format
- ✅ Widget React components accessing window.openai.toolOutput
- ✅ MCP resource registration with ui:// URIs
- ✅ Build system copies templates to dist/widgets/templates/
- ✅ Static serving of widget JS bundles with CORS headers

**The Problem:** `McpServer` class strips OpenAI extensions (`structuredContent` and `_meta`) from tool responses.

**The Solution:** Refactor to use base `Server` class with manual request handlers (like Pizzaz example).

---

## What Needs to Be Done

### 1. Switch from McpServer to Base Server Class

**File:** `src/index.ts`

**Current:**
```typescript
import { OpenAIMcpServer } from "./lib/openai-mcp-server.ts";

const server = new OpenAIMcpServer({ name, version, capabilities });
server.registerTool(name, options, handler);
server.registerResource(name, uri, meta, handler);
```

**Target:**
```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name, version },
  { capabilities: { resources: {}, tools: {} } }
);
```

### 2. Build Tool Registry

Create an array of tool definitions with OpenAI metadata:

```typescript
const tools = [
  {
    name: "get_current_build",
    title: "Get Current Car Build",
    description: "Retrieve or create the user's active car build",
    inputSchema: { type: "object", properties: {} },
    _meta: {
      "openai/outputTemplate": "ui://widget/car-build-card",
      "openai/toolInvocation/invoking": "Loading your car build...",
      "openai/toolInvocation/invoked": "Here's your customized ride!",
      "openai/widgetAccessible": true,
      "openai/resultCanProduceWidget": true,
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: true,
    },
  },
  // ... all other tools
];
```

### 3. Implement ListTools Request Handler

```typescript
server.setRequestHandler(
  ListToolsRequestSchema,
  async (_request: ListToolsRequest) => ({
    tools,
  })
);
```

### 4. Build Resource Registry

Create an array of widget resource definitions:

```typescript
const resources = Object.values(WIDGETS).map((widget) => ({
  uri: widget.uri,
  name: widget.id,
  description: `${widget.id} widget`,
  mimeType: "text/html+skybridge",
  _meta: {
    "openai/widgetPrefersBorder": true,
  },
}));
```

### 5. Implement ListResources Request Handler

```typescript
server.setRequestHandler(
  ListResourcesRequestSchema,
  async (_request: ListResourcesRequest) => ({
    resources,
  })
);
```

### 6. Create Tool Handler Map

Map tool names to their handler functions:

```typescript
const toolHandlers: Record<string, (args: any) => Promise<any>> = {
  get_current_build: async (args) => {
    const build = await getCurrentBuild(kv, identity);
    const summary = `Your ${build.car.color} build "${build.name || 'Unnamed'}"`;
    return createUIResult(build, summary, WIDGETS.carBuildCard);
  },
  update_car_config: async (args) => {
    const build = await updateCarConfig(kv, identity, args);
    const summary = `Updated your build - now ${build.car.color}`;
    return createUIResult(build, summary, WIDGETS.carBuildCard);
  },
  // ... all other tools
};
```

### 7. Implement CallTool Request Handler

```typescript
server.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest) => {
    const { name, arguments: args } = request.params;

    const handler = toolHandlers[name];
    if (!handler) {
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }

    try {
      logger.info("Tool executed", { name, userId: identity.userId });
      const result = await handler(args);

      logger.info("Returning result", {
        hasStructuredContent: !!result.structuredContent,
        hasMeta: !!result._meta,
      });

      return result;  // All fields pass through!
    } catch (error) {
      logger.error("Tool execution failed", { name, error });
      return createErrorResult(error);
    }
  }
);
```

### 8. Create Resource Handler Map

Map resource URIs to their handler functions:

```typescript
const resourceHandlers: Record<string, () => Promise<string>> = {
  "ui://widget/car-build-card": async () => {
    const widget = WIDGETS.carBuildCard;
    const templatePath = join(__dirname, "widgets", "templates", widget.templateFile);
    let template = await readFile(templatePath, "utf-8");
    return template.replace(/\{\{BASE_URL\}\}/g, config.WIDGET_BASE_URL);
  },
  // ... all other widgets
};
```

### 9. Implement ReadResource Request Handler

```typescript
server.setRequestHandler(
  ReadResourceRequestSchema,
  async (request: ReadResourceRequest) => {
    const { uri } = request.params;

    const handler = resourceHandlers[uri];
    if (!handler) {
      throw new Error(`Unknown resource: ${uri}`);
    }

    try {
      logger.info("🎨 WIDGET RESOURCE REQUESTED", { uri });
      const template = await handler();

      logger.info("✅ Serving widget resource", {
        uri,
        templateLength: template.length,
      });

      return {
        contents: [{
          uri,
          mimeType: "text/html+skybridge",
          text: template,
        }],
      };
    } catch (error) {
      logger.error("Failed to load widget template", { uri, error });
      throw error;
    }
  }
);
```

### 10. Handle Identity Resolution

The current implementation creates a new server instance per request to resolve identity. This pattern can continue:

```typescript
const getServer = (req: express.Request) => {
  const identity = resolveIdentity(req);
  const server = new Server(...);

  // Set up all handlers with access to identity closure
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    // identity is available here
  });

  return server;
};
```

### 11. Remove OpenAIMcpServer

**Files to delete:**
- `src/lib/openai-mcp-server.ts` (no longer needed)

### 12. Update Types

Import required types:

```typescript
import type {
  ListToolsRequest,
  CallToolRequest,
  ListResourcesRequest,
  ReadResourceRequest,
  Tool,
  Resource,
  CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
```

---

## Implementation Strategy

### Option A: Incremental Refactor (Recommended)

1. Create new `src/server/base-server.ts` with base Server implementation
2. Test alongside existing `OpenAIMcpServer` implementation
3. Switch `getServer()` to use new implementation
4. Delete `OpenAIMcpServer` after verification

### Option B: Direct Replacement

1. Replace all McpServer code in `src/index.ts` directly
2. Test immediately

**Recommendation:** Option A - safer, allows comparison

---

## Reference Implementation

See the Pizzaz example for reference:
- [pizzaz_server_node/src/server.ts](https://github.com/openai/openai-apps-sdk-examples/blob/main/pizzaz_server_node/src/server.ts)

Key patterns to follow:
- Tool and resource arrays built upfront
- Handler maps for dynamic dispatch
- Request handler pattern with schemas
- All OpenAI extensions in tool/resource metadata

---

## Expected Outcome

After refactoring:

1. **Tools list includes _meta fields** - ChatGPT sees widget metadata
2. **Tool responses include structuredContent and _meta** - Data reaches widgets
3. **Resources are requested** - Logs show `🎨 WIDGET RESOURCE REQUESTED`
4. **Widgets render in ChatGPT** - Interactive UI appears

---

## Testing Checklist

After implementation:

- [ ] Server starts without errors
- [ ] `curl http://localhost:3000/mcp` shows capabilities: ["tools", "resources"]
- [ ] ChatGPT can connect to MCP server
- [ ] Invoking tool shows logs:
  - [ ] `Tool executed`
  - [ ] `Returning result` with metadata
  - [ ] `🎨 WIDGET RESOURCE REQUESTED`
  - [ ] `✅ Serving widget resource`
- [ ] Widget renders in ChatGPT with car data
- [ ] Multiple tools work (test at least 3)
- [ ] Error handling works gracefully

---

## Files to Modify

### Primary Changes
- `src/index.ts` - Complete refactor to base Server class

### Files to Delete
- `src/lib/openai-mcp-server.ts` - No longer needed

### Files to Review (No changes needed)
- `src/lib/ui/response.ts` - Already creates correct format
- `src/lib/ui/widget-meta.ts` - Already creates correct metadata
- `src/widgets/registry.ts` - Already has ui:// URIs
- Widget components - Already access window.openai.toolOutput
- Widget templates - Already use {{BASE_URL}} placeholder

---

## Potential Issues

### Issue: Identity resolution per request

**Current pattern:** New server instance per request
**Solution:** Continue this pattern - request handlers have access to identity via closure

### Issue: Schema validation for tool inputs

**Current:** Zod schemas in `inputSchema`
**Solution:** Same - convert Zod to JSON Schema for MCP spec

### Issue: Error handling

**Current:** `createErrorResult()` helper
**Solution:** Return standard error format with `isError: true`

---

## Questions to Clarify

1. Should we keep separate server instance per request for identity resolution?
   - **Recommendation:** Yes, simplest approach

2. How to handle Zod schema to JSON Schema conversion?
   - **Current approach:** Pass Zod directly (MCP SDK handles it)
   - **Alternative:** Use zod-to-json-schema library

3. Should we create helper functions to reduce boilerplate?
   - **Recommendation:** Yes, create `createToolDefinition()` and `createResourceDefinition()` helpers

---

## Success Criteria

Implementation is complete when:

1. ✅ Server uses base `Server` class (not McpServer)
2. ✅ All four request handlers implemented
3. ✅ All 10 tools work and return UI results
4. ✅ All 4 widgets load successfully
5. ✅ Logs show resources being requested
6. ✅ ChatGPT renders widgets with live data
7. ✅ Code is clean and well-documented

---

## Timeline Estimate

- **Setup & scaffolding:** 30 min
- **Tool handler implementation:** 1 hour
- **Resource handler implementation:** 30 min
- **Testing & debugging:** 1-2 hours
- **Cleanup & documentation:** 30 min

**Total:** 3-4 hours

---

Ready to implement! Start with creating the tool and resource registries, then implement the four request handlers.
