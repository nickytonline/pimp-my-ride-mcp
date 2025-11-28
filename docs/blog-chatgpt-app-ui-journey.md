# Building ChatGPT App UI with MCP: A Deep Dive into Widget Integration

## Introduction

We recently implemented UI widgets for a Model Context Protocol (MCP) server to create an interactive ChatGPT App. What seemed like a straightforward integration turned into a fascinating exploration of how ChatGPT's Apps SDK actually works under the hood. This post documents our journey, the critical issues we encountered, and the solutions we discovered.

## The Goal

Transform an MCP server from returning plain text to rendering interactive React widgets in ChatGPT. Users should see rich UI components displaying car customization data instead of JSON blobs.

## The Three Critical Issues

### Issue #1: URI Format - HTTP URLs vs. ui:// Resources

**What We Tried First:**
```typescript
"openai/outputTemplate": "http://localhost:3000/widgets/car-build-card.js"
```

**The Problem:** ChatGPT doesn't load widgets from HTTP URLs directly in the metadata.

**The Solution:** Use MCP resource URIs with the `ui://` scheme:
```typescript
"openai/outputTemplate": "ui://widget/car-build-card"
```

The `ui://` URI references an MCP resource that must be registered on the server. ChatGPT requests this resource through the MCP protocol, not via HTTP.

### Issue #2: Missing Resource Registration

**What We Learned:** Simply returning metadata isn't enough. You must register each widget as an MCP resource.

**The Implementation:**
```typescript
server.registerResource(
  "car_build_card",
  "ui://widget/car-build-card",
  {
    title: "Car Build Card widget",
    description: "HTML template for car_build_card",
  },
  async () => {
    const template = await readFile("templates/car-build-card.html", "utf-8");
    return {
      contents: [{
        uri: "ui://widget/car-build-card",
        mimeType: "text/html+skybridge",  // Critical!
        text: template,
      }],
    };
  }
);
```

**Key Points:**
- The URI must match what's in `openai/outputTemplate`
- MIME type must be `text/html+skybridge` (not `text/html`)
- The resource returns HTML that loads JavaScript bundles

### Issue #3: HTML Templates Required (Not Raw JavaScript)

**What We Expected:** Point to JavaScript bundles directly.

**What Actually Works:** HTML templates that load the JavaScript.

**Template Structure:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="https://your-server.com/widgets/vendor.js"></script>
  <script type="module" src="https://your-server.com/widgets/car-build-card.js"></script>
</body>
</html>
```

The HTML is served through MCP resources, but the JavaScript bundles are loaded via HTTP from your server.

## The Data Flow

Here's how it all works together:

```
1. Tool Invoked in ChatGPT
   ↓
2. Tool returns:
   {
     content: [{ type: "text", text: "Summary" }],
     structuredContent: { ...build data... },
     _meta: {
       "openai/outputTemplate": "ui://widget/car-build-card"
     }
   }
   ↓
3. ChatGPT sees ui:// URI and requests MCP resource
   ↓
4. MCP server returns HTML with mimeType="text/html+skybridge"
   ↓
5. HTML loads JavaScript from http://your-server/widgets/
   ↓
6. Widget renders in iframe
   ↓
7. Widget accesses data via window.openai.toolOutput
```

## The McpServer Problem

### What We Discovered

The `McpServer` class from `@modelcontextprotocol/sdk/server/mcp.js` validates and serializes tool responses according to the official MCP specification. The problem? OpenAI's Apps SDK extensions (`structuredContent` and `_meta`) are **not part of the standard MCP spec**.

### Why This Matters

When you return a tool result with OpenAI extensions:

```typescript
return {
  content: [{ type: "text", text: "Summary" }],
  structuredContent: buildData,  // OpenAI extension
  _meta: widgetMetadata,          // OpenAI extension
};
```

The `McpServer` class only serializes the standard `CallToolResult` fields. It strips out `structuredContent` and `_meta` because they're not in the MCP spec.

### Evidence

We added comprehensive logging:

```typescript
logger.info("Returning UI result", {
  hasStructuredContent: !!result.structuredContent,
  hasMeta: !!result._meta,
  outputTemplate: result._meta?.["openai/outputTemplate"],
});
```

The result object had all the fields before returning. But ChatGPT never requested the widget resources - it never saw the `_meta` field.

### Why TypeScript Doesn't Help

TypeScript errors are compile-time only. The JavaScript runs fine with extra fields. But `McpServer` has **runtime validation/serialization** that actively removes non-standard fields before sending to the client.

## The Solution: Base Server Class

The OpenAI examples (like Pizzaz) use the **base `Server` class**, not `McpServer`:

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

const server = new Server(
  {
    name: "my-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);
```

### Why This Works

The base `Server` class uses a lower-level API with manual request handlers. You implement the MCP protocol yourself using `setRequestHandler`:

```typescript
// List tools
server.setRequestHandler(
  ListToolsRequestSchema,
  async () => ({
    tools: [
      {
        name: "get_build",
        description: "Get car build",
        _meta: {  // OpenAI extension - passes through!
          "openai/outputTemplate": "ui://widget/car-build-card"
        }
      }
    ]
  })
);

// Handle tool calls
server.setRequestHandler(
  CallToolRequestSchema,
  async (request) => {
    const result = await executeToolHandler(request.params.name);
    return result;  // All fields pass through as-is
  }
);

// List resources
server.setRequestHandler(
  ListResourcesRequestSchema,
  async () => ({
    resources: widgetResources
  })
);

// Read resources
server.setRequestHandler(
  ReadResourceRequestSchema,
  async (request) => {
    const widget = findWidget(request.params.uri);
    return {
      contents: [{
        uri: widget.uri,
        mimeType: "text/html+skybridge",
        text: await loadTemplate(widget)
      }]
    };
  }
);
```

**No validation, no serialization - just raw protocol handling.** Your OpenAI extensions pass through untouched.

## Attempted Solutions That Didn't Work

### 1. Type Assertions (`as any`)

```typescript
return result as any;
```

**Why it failed:** TypeScript doesn't control runtime behavior. `McpServer` still stripped fields.

### 2. Custom `OpenAIMcpServer` Wrapper

```typescript
class OpenAIMcpServer extends McpServer {
  registerTool(name, options, handler) {
    super.registerTool(name, options, async (args) => {
      const result = await handler(args);
      return result as any;  // Hope it passes through
    });
  }
}
```

**Why it failed:** The serialization happens deeper in the `McpServer` internals, not in `registerTool`. Wrapping the handler didn't bypass the validation.

## Architecture Recommendations

### For Standard MCP Servers (No UI)

Use `McpServer` - it handles protocol details and validation for you:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer({ name, version });
server.registerTool("my_tool", schema, handler);
```

### For ChatGPT App UI (With Widgets)

Use the base `Server` class with manual request handlers:

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(config, { capabilities });

// Implement all four handlers manually
server.setRequestHandler(ListToolsRequestSchema, ...);
server.setRequestHandler(CallToolRequestSchema, ...);
server.setRequestHandler(ListResourcesRequestSchema, ...);
server.setRequestHandler(ReadResourceRequestSchema, ...);
```

**Trade-off:** More code, but complete control over the protocol and data flow.

## Key Takeaways

1. **ui:// URIs are MCP resources, not HTTP URLs** - ChatGPT requests them through the MCP protocol

2. **text/html+skybridge is required** - Regular `text/html` won't work

3. **HTML templates wrap JavaScript bundles** - You can't point directly to JS files

4. **McpServer strips OpenAI extensions** - Use the base `Server` class for widget support

5. **Resources must be registered** - Both in tool metadata AND as actual MCP resources

6. **TypeScript can't help with runtime serialization** - The issue is in `McpServer`'s internals

7. **Check the examples** - OpenAI's Pizzaz example uses `Server`, not `McpServer`, for a reason

## What's Next

We're now refactoring to use the base `Server` class with manual request handlers. This will give us full control over tool responses and ensure OpenAI extensions pass through correctly.

The good news? The widget components, HTML templates, and resource infrastructure we built are all correct. We just need to switch the server implementation from `McpServer` to `Server` to make it all work.

## Resources

- [OpenAI Apps SDK Documentation](https://developers.openai.com/apps-sdk/)
- [Pizzaz Server Example](https://github.com/openai/openai-apps-sdk-examples/tree/main/pizzaz_server_node)
- [MCP Specification](https://modelcontextprotocol.io/)
- [Our Implementation PRD](../PRD-CHATGPT-APP-UI.md)
- [Setup Guide](../CHATGPT_APP_SETUP.md)

## Conclusion

Building ChatGPT App UI with MCP is powerful but requires understanding the subtle differences between standard MCP and OpenAI's extensions. The key insight: **`McpServer` is designed for standard MCP, not OpenAI Apps**. For widgets, you need the flexibility of the base `Server` class.

We hope this deep dive helps others avoid the hours we spent debugging why our perfectly valid metadata wasn't reaching ChatGPT!

---

*This post documents our implementation of the Pimp My Ride MCP server, a car customization demo showing how to build interactive ChatGPT Apps with Model Context Protocol.*
