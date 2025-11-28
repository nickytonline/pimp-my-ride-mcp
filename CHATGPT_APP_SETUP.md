# ChatGPT App UI Setup Guide

## What Was Fixed

The ChatGPT App UI integration wasn't working due to three critical issues:

### 1. **Wrong URI Format**
- **Problem**: Widget metadata was using HTTP URLs (`http://localhost:5173/widgets/car-build-card.js`)
- **Solution**: Changed to MCP resource URIs (`ui://widget/car-build-card`)

### 2. **Missing MCP Resource Registration**
- **Problem**: Widgets weren't registered as MCP resources with the required `text/html+skybridge` MIME type
- **Solution**: Added `server.registerResource()` calls for each widget in `src/index.ts`

### 3. **Wrong File Format**
- **Problem**: Tool responses pointed directly to JavaScript bundles
- **Solution**: Created HTML templates that load the JS bundles via `<script>` tags

## Architecture

```
┌─────────────────────────────────────────────┐
│ ChatGPT                                     │
│  ↓ Calls MCP Tool                          │
│  ↓ Receives _meta["openai/outputTemplate"] │
│  ↓ = "ui://widget/car-build-card"         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ MCP Server                                  │
│  → Registered resource with:                │
│     - URI: ui://widget/car-build-card       │
│     - MIME: text/html+skybridge             │
│  → Returns HTML template                    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ HTML Template                               │
│  <script src="{{BASE_URL}}/widgets/        │
│           vendor.js"></script>              │
│  <script src="{{BASE_URL}}/widgets/        │
│           car-build-card.js"></script>      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ React Widget (loads in ChatGPT iframe)      │
│  → Accesses window.openai.toolOutput        │
│  → Renders interactive UI                   │
└─────────────────────────────────────────────┘
```

## Key Files Modified

1. **src/widgets/registry.ts**
   - Updated `WidgetDescriptor` interface to include `uri` and `templateFile`
   - Changed from HTTP URLs to `ui://` URIs

2. **src/lib/ui/widget-meta.ts**
   - Simplified to use `widget.uri` directly in `openai/outputTemplate`
   - Removed HTTP URL construction logic

3. **src/index.ts**
   - Added MCP resource registration for all widgets
   - Resources load HTML templates from `dist/widgets/templates/`
   - Templates have `{{BASE_URL}}` placeholder replaced with `WIDGET_BASE_URL`

4. **src/widgets/templates/*.html** (NEW)
   - Created HTML templates for each widget
   - Load vendor.js and widget-specific JS bundles

5. **vite.config.ts**
   - Added `vite-plugin-static-copy` to copy templates to dist during build

6. **src/config.ts**
   - Changed default `WIDGET_BASE_URL` to `http://localhost:3000/widgets`

## Environment Variables

Set these environment variables for your deployment:

```bash
# Required: Your server's public URL for serving widgets
WIDGET_BASE_URL=https://your-server.com/widgets

# Optional: Server configuration
PORT=3000
NODE_ENV=production
```

## Building and Running

```bash
# Build everything (server + widgets + templates)
npm run build

# Start production server
npm start

# Development with hot reloading
npm run dev
```

## Testing Widgets

1. **Start the server**:
   ```bash
   npm start
   ```

2. **Verify widgets are served**:
   ```bash
   curl http://localhost:3000/widgets/vendor.js
   curl http://localhost:3000/widgets/car-build-card.js
   ```

3. **Test in ChatGPT Developer Mode**:
   - Add your MCP server to ChatGPT
   - Invoke a tool like `get_current_build`
   - The widget should render inline in the chat

## MCP Resources Registered

All widgets are registered with these URIs:

- `ui://widget/car-build-card` - Shows car build details
- `ui://widget/build-list` - Lists all saved builds
- `ui://widget/persona-card` - Displays driver persona info
- `ui://widget/options-grid` - Shows customization options

## CORS Configuration

The Express server already has proper CORS headers for the `/widgets` endpoint:

```typescript
app.use("/widgets", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
}, express.static("dist/widgets"));
```

## How Tool Responses Work

When a tool returns a UI result:

```typescript
return createUIResult(build, summary, WIDGETS.carBuildCard);
```

This creates:

```typescript
{
  content: [{ type: "text", text: summary }],
  structuredContent: build,  // Passed to widget via window.openai.toolOutput
  _meta: {
    "openai/outputTemplate": "ui://widget/car-build-card",
    "openai/toolInvocation/invoking": "Loading your car build...",
    "openai/toolInvocation/invoked": "Here's your customized ride!",
    "openai/widgetAccessible": true,
    "openai/resultCanProduceWidget": true
  }
}
```

## Debugging

If widgets don't load:

1. **Check MCP resource registration**:
   - Look for "Serving widget resource" logs
   - Verify templates exist in `dist/widgets/templates/`

2. **Check widget URL**:
   - Ensure `WIDGET_BASE_URL` is accessible from ChatGPT
   - May need HTTPS and public URL in production

3. **Check browser console** in ChatGPT:
   - Open DevTools in ChatGPT window
   - Look for CORS errors or 404s loading widget bundles

4. **Verify metadata**:
   - Use MCP Inspector to check tool responses
   - Confirm `openai/outputTemplate` matches registered resource URI

## References

- [OpenAI Apps SDK Documentation](https://developers.openai.com/apps-sdk/)
- [MCP Specification](https://modelcontextprotocol.io/)
- [Example: Pizzaz Server](https://github.com/openai/openai-apps-sdk-examples/tree/main/pizzaz_server_node)
- [Community Forum](https://community.openai.com/c/chatgpt-apps-sdk/)
