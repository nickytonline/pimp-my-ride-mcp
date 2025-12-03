import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ServerOptions } from "@modelcontextprotocol/sdk/server/index.js";
import type { Implementation } from "@modelcontextprotocol/sdk/types.js";

export class OpenAIMcpServer extends McpServer {
  constructor(serverInfo: Implementation, options?: ServerOptions) {
    super(serverInfo, options);
  }
}
