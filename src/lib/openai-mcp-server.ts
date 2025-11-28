/**
 * Extended MCP Server that supports OpenAI Apps SDK widget extensions
 *
 * This class extends the standard McpServer to allow OpenAI-specific fields
 * like `structuredContent` and `_meta` to pass through in tool responses.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * OpenAI-extended CallToolResult that includes widget metadata
 */
export interface OpenAICallToolResult extends CallToolResult {
  structuredContent?: { [x: string]: unknown };
  _meta?: Record<string, unknown>;
}

/**
 * MCP Server with OpenAI Apps SDK support
 */
export class OpenAIMcpServer extends McpServer {
  /**
   * Override registerTool to accept handlers that return OpenAI-extended results
   */
  registerTool(
    name: string,
    options: {
      title?: string;
      description: string;
      inputSchema?: Record<string, any>;
      annotations?: {
        readOnlyHint?: boolean;
        destructiveHint?: boolean;
        openWorldHint?: boolean;
      };
    },
    handler: (args: any) => Promise<OpenAICallToolResult>
  ): void {
    // Call parent registerTool but wrap the handler
    super.registerTool(name, options, async (args) => {
      const result = await handler(args);

      // Return result as-is - the type system will allow OpenAI extensions
      // to pass through without validation
      return result as any;
    });
  }
}
