/**
 * Extended MCP Server that supports OpenAI Apps SDK widget extensions
 *
 * This class wraps the base Server class and manually handles requests to allow
 * OpenAI-specific fields like `structuredContent` and `_meta` to pass through.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  type CallToolResult,
  type Tool,
  type Resource,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * OpenAI-extended CallToolResult that includes widget metadata
 */
export interface OpenAICallToolResult extends CallToolResult {
  structuredContent?: { [x: string]: unknown };
  _meta?: Record<string, unknown>;
}

interface ToolDefinition {
  name: string;
  title?: string;
  description: string;
  inputSchema: any;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    openWorldHint?: boolean;
  };
  _meta?: Record<string, unknown>;
  handler: (args: any) => Promise<OpenAICallToolResult>;
}

interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  _meta?: Record<string, unknown>;
  handler: () => Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }>;
}

/**
 * MCP Server with OpenAI Apps SDK support
 */
export class OpenAIMcpServer {
  #server: Server;
  #tools: Map<string, ToolDefinition> = new Map();
  #resources: Map<string, ResourceDefinition> = new Map();

  constructor(config: {
    name: string;
    version: string;
    capabilities: {
      resources?: {};
      tools?: {};
    };
  }) {
    this.#server = new Server(
      { name: config.name, version: config.version },
      { capabilities: config.capabilities }
    );

    this.#setupRequestHandlers();
  }

  #setupRequestHandlers(): void {
    // Handle ListTools requests
    this.#server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = Array.from(this.#tools.values()).map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        ...(tool.title && { title: tool.title }),
        ...(tool.annotations && { annotations: tool.annotations }),
        ...(tool._meta && { _meta: tool._meta }),
      }));

      return { tools };
    });

    // Handle CallTool requests
    this.#server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      const tool = this.#tools.get(name);
      if (!tool) {
        return {
          content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
          isError: true,
        };
      }

      try {
        const result = await tool.handler(args || {});
        // Return result with all OpenAI extensions intact
        return result;
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });

    // Handle ListResources requests
    this.#server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources: Resource[] = Array.from(this.#resources.values()).map((resource) => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
        ...(resource._meta && { _meta: resource._meta }),
      }));

      return { resources };
    });

    // Handle ReadResource requests
    this.#server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      const resource = this.#resources.get(uri);
      if (!resource) {
        throw new Error(`Unknown resource: ${uri}`);
      }

      try {
        return await resource.handler();
      } catch (error) {
        throw new Error(
          `Failed to read resource: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  /**
   * Register a tool with OpenAI widget metadata support
   */
  registerTool(
    name: string,
    options: {
      title?: string;
      description: string;
      inputSchema?: any;
      annotations?: {
        readOnlyHint?: boolean;
        destructiveHint?: boolean;
        openWorldHint?: boolean;
      };
      _meta?: Record<string, unknown>;
    },
    handler: (args: any) => Promise<OpenAICallToolResult>
  ): void {
    this.#tools.set(name, {
      name,
      title: options.title,
      description: options.description,
      inputSchema: options.inputSchema || { type: "object", properties: {} },
      annotations: options.annotations,
      _meta: options._meta,
      handler,
    });
  }

  /**
   * Register a resource with OpenAI widget metadata support
   */
  registerResource(
    name: string,
    uri: string,
    options: {
      title?: string;
      description: string;
      mimeType?: string;
      _meta?: Record<string, unknown>;
    },
    handler: () => Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }>
  ): void {
    this.#resources.set(uri, {
      uri,
      name,
      description: options.description,
      mimeType: options.mimeType || "text/plain",
      _meta: options._meta,
      handler,
    });
  }

  /**
   * Connect the server to a transport
   */
  async connect(transport: Transport): Promise<void> {
    await this.#server.connect(transport);
  }
}
