# PRD: OpenAIMcpServer Refactoring

## Overview

Refactor the `OpenAIMcpServer` class to properly extend the official `McpServer` class from `@modelcontextprotocol/sdk` while adding OpenAI ChatGPT Apps-specific extensions for widget metadata and structured content.

## Problem Statement

The current `OpenAIMcpServer` implementation wraps the base `Server` class but doesn't extend the higher-level `McpServer` class. This means:

1. **Missing API**: We don't have access to the convenient `McpServer` API (e.g., `.tool()`, `.resource()`, `.prompt()` methods with various overloads)
2. **Inconsistent Interface**: Users expect the same interface as `McpServer` but with OpenAI extensions
3. **Manual Handler Management**: We're manually managing request handlers instead of leveraging `McpServer`'s built-in functionality
4. **Registration Management**: Missing features like `.enable()`, `.disable()`, `.update()`, `.remove()` on registered tools/resources
5. **Dynamic Updates**: No support for sending list changed notifications when tools/resources are modified

## Goals

### Primary Goals

1. **Maintain McpServer Interface**: `OpenAIMcpServer` should be a drop-in replacement for `McpServer` with identical API
2. **Add OpenAI Extensions**: Support ChatGPT Apps-specific features like `_meta`, `structuredContent`, and widget templates
3. **Backward Compatibility**: Ensure existing MCP functionality continues to work without OpenAI extensions
4. **Type Safety**: Maintain full TypeScript type safety for both standard and OpenAI-extended features

### Secondary Goals

1. **Testing Strategy**: Create a test plan that validates standard MCP functionality before testing OpenAI extensions
2. **Documentation**: Clear examples showing how to use both standard and OpenAI-extended features
3. **Minimal Overhead**: OpenAI extensions should not add overhead to standard MCP operations

## Non-Goals

- Modifying the base `McpServer` or `Server` classes
- Supporting OpenAI extensions in other MCP implementations
- Creating a general-purpose plugin system for MCP

## Technical Design

### Architecture

```
┌─────────────────────────────┐
│   OpenAIMcpServer           │
│   (extends McpServer)       │
├─────────────────────────────┤
│ • Inherits all McpServer    │
│   methods and properties    │
│ • Overrides registerTool()  │
│ • Overrides registerResource│
│ • Stores OpenAI metadata    │
└─────────────────────────────┘
          │
          │ extends
          ▼
┌─────────────────────────────┐
│      McpServer              │
│ (from @modelcontextprotocol)│
├─────────────────────────────┤
│ • tool() methods            │
│ • resource() methods        │
│ • prompt() methods          │
│ • Base registration logic   │
└─────────────────────────────┘
          │
          │ uses
          ▼
┌─────────────────────────────┐
│        Server               │
│ (from @modelcontextprotocol)│
├─────────────────────────────┤
│ • Request handling          │
│ • Transport management      │
│ • Protocol implementation   │
└─────────────────────────────┘
```

### Key Design Decisions

#### 1. Inheritance Strategy

**Decision**: Extend `McpServer` and override/intercept registration methods

**Rationale**:

- Preserves all `McpServer` functionality and API
- Allows us to inject OpenAI metadata into the protocol layer
- Minimal code duplication

**Alternative Considered**: Composition (wrapping `McpServer`)

- **Rejected**: Would require re-implementing entire API surface
- **Rejected**: Harder to maintain type compatibility

#### 2. Metadata Storage

**Decision**: Store OpenAI metadata separately and inject it during protocol handling

**Implementation**:

```typescript
private _openaiToolMetadata: Map<string, { _meta?: Record<string, unknown> }> = new Map();
private _openaiResourceMetadata: Map<string, { _meta?: Record<string, unknown> }> = new Map();
```

**Rationale**:

- `McpServer` doesn't expose internal storage structures
- We need to augment responses without modifying base class behavior
- Clean separation of concerns

#### 3. Request Handler Interception

**Decision**: Override `McpServer` methods and use `server.setRequestHandler()` to inject OpenAI extensions

**Implementation**:

```typescript
// In constructor, after super()
this.server.setRequestHandler(ListToolsRequestSchema, async () => {
  // Get base tools from parent
  const baseResult = await super.server.getRequestHandler(
    ListToolsRequestSchema,
  )?.();

  // Inject OpenAI metadata
  return {
    tools: baseResult.tools.map((tool) => ({
      ...tool,
      ...(this._openaiToolMetadata.get(tool.name)?._meta && {
        _meta: this._openaiToolMetadata.get(tool.name)._meta,
      }),
    })),
  };
});
```

**Rationale**:

- Leverages existing protocol infrastructure
- Doesn't modify base class behavior
- Can augment responses with OpenAI extensions

#### 4. Registration API

**Decision**: Provide both `McpServer`-compatible methods and OpenAI-extended versions

**API Design**:

```typescript
// Standard McpServer methods (inherited)
tool(name: string, cb: ToolCallback): RegisteredTool;
tool(name: string, description: string, cb: ToolCallback): RegisteredTool;
// ... all other overloads

// OpenAI-extended method (new)
registerTool<InputArgs extends ZodRawShape>(
  name: string,
  config: {
    title?: string;
    description?: string;
    inputSchema?: InputArgs;
    outputSchema?: OutputArgs;
    annotations?: ToolAnnotations;
    _meta?: Record<string, unknown>;  // OpenAI extension
  },
  cb: OpenAIToolCallback<InputArgs>  // Returns OpenAICallToolResult
): RegisteredTool;
```

**Rationale**:

- Users can use standard `McpServer` API for non-widget tools
- OpenAI-extended API is opt-in via `registerTool()`
- Clear distinction between standard and extended functionality

### Interface Definitions

```typescript
/**
 * OpenAI-extended CallToolResult that includes widget metadata
 */
export interface OpenAICallToolResult extends CallToolResult {
  structuredContent?: { [x: string]: unknown };
  _meta?: Record<string, unknown>;
}

/**
 * Tool callback that can return OpenAI extensions
 */
export type OpenAIToolCallback<
  Args extends undefined | ZodRawShape = undefined,
> = Args extends ZodRawShape
  ? (
      args: z.objectOutputType<Args, ZodTypeAny>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
    ) => OpenAICallToolResult | Promise<OpenAICallToolResult>
  : (
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
    ) => OpenAICallToolResult | Promise<OpenAICallToolResult>;
```

## Implementation Plan

### Phase 1: Refactor to Extend McpServer ✓

**Goal**: Change inheritance from `Server` to `McpServer`

**Tasks**:

1. ✓ Update class declaration: `export class OpenAIMcpServer extends McpServer`
2. ✓ Update constructor to call `super(serverInfo, options)`
3. ✓ Remove manual tool/resource storage (use parent's)
4. ✓ Add OpenAI metadata storage maps
5. ✓ Update `connect()` to delegate to `super.connect()`

**Testing Strategy**:

- Test standard `McpServer` functionality without OpenAI extensions
- Verify all `.tool()` overloads work correctly
- Verify `.resource()` methods work correctly
- Test `.enable()`, `.disable()`, `.update()`, `.remove()` on registered items

**Acceptance Criteria**:

- [ ] All existing `McpServer` tests pass
- [ ] Can register tools using standard `tool()` method
- [ ] Can register resources using standard `resource()` method
- [ ] Tool/resource management methods work (enable, disable, etc.)

### Phase 2: Implement OpenAI Metadata Storage

**Goal**: Add infrastructure to store and retrieve OpenAI metadata

**Tasks**:

1. Add private metadata maps for tools and resources
2. Create helper methods to store metadata
3. Create helper methods to retrieve and inject metadata
4. Ensure metadata is associated with correct tool/resource names

**Testing Strategy**:

- Unit tests for metadata storage and retrieval
- Test metadata persistence across updates
- Test metadata cleanup on tool/resource removal

**Acceptance Criteria**:

- [ ] Metadata correctly associated with tools/resources
- [ ] Metadata survives enable/disable operations
- [ ] Metadata cleaned up when items are removed

### Phase 3: Intercept Protocol Handlers

**Goal**: Inject OpenAI metadata into MCP protocol responses

**Tasks**:

1. Override/extend `setToolRequestHandlers()` to inject metadata in `ListTools`
2. Override/extend `CallTool` handler to allow `structuredContent` in results
3. Override/extend `setResourceRequestHandlers()` to inject metadata in `ListResources`
4. Ensure standard MCP behavior preserved when no OpenAI metadata present

**Testing Strategy**:

- Test `ListTools` returns `_meta` when present
- Test `ListTools` works without `_meta` (standard behavior)
- Test `CallTool` returns `structuredContent` when provided
- Test `CallTool` works with standard results
- Test `ListResources` returns `_meta` when present

**Acceptance Criteria**:

- [ ] `ListTools` response includes `_meta` for tools with metadata
- [ ] `CallTool` supports returning `structuredContent`
- [ ] `ListResources` response includes `_meta` for resources with metadata
- [ ] All standard MCP functionality preserved

### Phase 4: Implement OpenAI-Extended Registration Methods

**Goal**: Add OpenAI-specific registration API

**Tasks**:

1. Add `registerTool()` override that accepts `_meta`
2. Update signature to accept `OpenAIToolCallback` type
3. Add `registerResource()` override that accepts `_meta`
4. Ensure metadata is stored and injected correctly
5. Update existing code to use new methods

**Testing Strategy**:

- Test registering tools with `_meta`
- Test tool callbacks can return `structuredContent`
- Test registering resources with `_meta`
- Test mixed usage (some with OpenAI extensions, some without)

**Acceptance Criteria**:

- [ ] Can register tools with `_meta` property
- [ ] Tool callbacks can return `OpenAICallToolResult`
- [ ] Can register resources with `_meta` property
- [ ] Mixed standard/OpenAI tools work together

### Phase 5: Update Existing Implementation

**Goal**: Migrate current code to use refactored class

**Tasks**:

1. Update `src/index.ts` to use new `OpenAIMcpServer` API
2. Remove any workaround code from current implementation
3. Verify widget functionality still works with ChatGPT
4. Update any other code depending on `OpenAIMcpServer`

**Testing Strategy**:

- End-to-end testing with ChatGPT Desktop app
- Test all widget tools render correctly
- Test standard (non-widget) tools still work
- Test in both ChatGPT Apps and standard MCP clients

**Acceptance Criteria**:

- [ ] All widget tools work in ChatGPT Desktop app
- [ ] Standard tools work in both ChatGPT and MCP clients
- [ ] No regression in existing functionality

### Phase 6: Documentation and Examples

**Goal**: Document the new API and provide usage examples

**Tasks**:

1. Update README with `OpenAIMcpServer` usage
2. Add JSDoc comments to all public methods
3. Create examples showing standard vs. OpenAI-extended usage
4. Document migration path from current implementation

**Acceptance Criteria**:

- [ ] README clearly explains when to use OpenAI extensions
- [ ] Examples show both standard and extended usage
- [ ] Migration guide helps users update existing code

## Testing Strategy

### Test Phases

#### Phase 1: Standard McpServer Compatibility

**Before testing OpenAI extensions, validate base functionality**

Tests:

1. Tool registration with all `.tool()` overloads
2. Resource registration with all `.resource()` overloads
3. Tool enable/disable/update/remove
4. Resource enable/disable/update/remove
5. List changed notifications
6. Tool callbacks execute correctly
7. Resource read callbacks execute correctly

#### Phase 2: OpenAI Extensions

**After Phase 1 passes, test OpenAI-specific features**

Tests:

1. Tools with `_meta` appear in `ListTools` response
2. Tools without `_meta` don't have extra fields
3. `structuredContent` returned from tool callbacks
4. Resources with `_meta` appear in `ListResources` response
5. Mixed tools (with and without OpenAI extensions)

#### Phase 3: Integration Testing

**Test with real clients**

Tests:

1. Connect to standard MCP client (e.g., Claude Desktop)
2. Connect to ChatGPT Desktop with widget tools
3. Verify widget rendering in ChatGPT
4. Verify standard tool execution in both clients

### Test Implementation

Create a test file: `src/lib/__tests__/openai-mcp-server.test.ts`

```typescript
describe("OpenAIMcpServer", () => {
  describe("McpServer Compatibility", () => {
    it("should register tools using .tool() method", () => {
      /* ... */
    });
    it("should support all .tool() overloads", () => {
      /* ... */
    });
    it("should enable/disable/update/remove tools", () => {
      /* ... */
    });
    // ... more standard tests
  });

  describe("OpenAI Extensions", () => {
    it("should include _meta in ListTools when provided", () => {
      /* ... */
    });
    it("should return structuredContent from tool callbacks", () => {
      /* ... */
    });
    it("should work with mixed standard/OpenAI tools", () => {
      /* ... */
    });
    // ... more extension tests
  });
});
```

## Success Metrics

1. **API Compatibility**: 100% of `McpServer` methods work identically
2. **Type Safety**: No `any` types in public API (except where McpServer uses them)
3. **Test Coverage**: >90% code coverage
4. **Widget Functionality**: All widget tools render correctly in ChatGPT
5. **Standard Compatibility**: All tools work in standard MCP clients

## Risks and Mitigations

### Risk 1: Breaking Changes to McpServer API

**Likelihood**: Low
**Impact**: High

**Mitigation**:

- Pin `@modelcontextprotocol/sdk` version
- Monitor SDK releases for breaking changes
- Consider forking if necessary

### Risk 2: OpenAI Extensions Break Standard MCP Clients

**Likelihood**: Medium
**Impact**: High

**Mitigation**:

- Test with multiple MCP clients
- Ensure OpenAI fields are truly optional/ignorable
- Document which fields are extensions

### Risk 3: Metadata Injection Complexity

**Likelihood**: Medium
**Impact**: Medium

**Mitigation**:

- Thorough unit testing of metadata injection
- Clear separation between standard and extended paths
- Fallback to standard behavior if injection fails

### Risk 4: Performance Overhead

**Likelihood**: Low
**Impact**: Low

**Mitigation**:

- Use efficient Map-based lookups for metadata
- Avoid unnecessary object copying
- Benchmark critical paths

## Open Questions

1. **Q**: Should we support `_meta` on prompts as well?
   **A**: TBD - need to check if ChatGPT Apps uses prompts

2. **Q**: Should `structuredContent` be validated against an output schema?
   **A**: Yes, if `outputSchema` is provided in tool registration

3. **Q**: How do we handle tool updates that change `_meta`?
   **A**: Store metadata separately, update when `.update()` is called

4. **Q**: Should we support other OpenAI extensions beyond `_meta` and `structuredContent`?
   **A**: Yes, document all extensions found in OpenAI's example

## Timeline

- **Phase 1**: 2-3 hours (refactor to extend McpServer)
- **Phase 2**: 1-2 hours (metadata storage)
- **Phase 3**: 3-4 hours (protocol handler interception)
- **Phase 4**: 2-3 hours (OpenAI registration methods)
- **Phase 5**: 1-2 hours (update existing code)
- **Phase 6**: 2-3 hours (documentation)

**Total Estimated Time**: 11-17 hours

## Appendix

### A. McpServer API Surface

Methods to preserve:

- `tool()` - 8 overloads
- `registerTool()` - 1 method
- `resource()` - 4 overloads
- `registerResource()` - 2 overloads
- `prompt()` - 4 overloads
- `registerPrompt()` - 1 method
- `connect()` - transport connection
- `close()` - cleanup
- `isConnected()` - status check
- `sendResourceListChanged()` - notification
- `sendToolListChanged()` - notification
- `sendPromptListChanged()` - notification
- `server` property - access to underlying Server

### B. OpenAI Extension Fields

Based on OpenAI's example server:

**Tool Extensions**:

- `_meta` on Tool definition (in ListTools response)
- `_meta` on CallToolResult
- `structuredContent` on CallToolResult

**Resource Extensions**:

- `_meta` on Resource definition (in ListResources response)
- Special MIME type: `text/html+skybridge` for widget templates

**Common Meta Fields** (from OpenAI example):

- `"openai/outputTemplate"`: Widget template URI
- `"openai/toolInvocation/invoking"`: Status message during execution
- `"openai/toolInvocation/invoked"`: Status message after execution
- `"openai/widgetAccessible"`: Boolean flag
- `"openai/resultCanProduceWidget"`: Boolean flag

### C. References

- [OpenAI Apps SDK Example](https://github.com/openai/openai-apps-sdk-examples/blob/main/pizzaz_server_node/src/server.ts)
- [MCP SDK McpServer](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [ChatGPT Apps Documentation](https://platform.openai.com/docs/chatgpt-apps)
