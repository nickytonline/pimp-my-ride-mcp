import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { createWidgetMeta, type WidgetDescriptor } from "./widget-meta.ts";

/**
 * Extended CallToolResult that includes UI widget metadata
 */
export interface UIToolResult extends CallToolResult {
  structuredContent: unknown;
  _meta: Record<string, unknown>;
}

/**
 * Creates a tool result with both text content and UI widget metadata
 * @param data - The structured data to include (passed to widget)
 * @param textSummary - Brief text summary for the conversation
 * @param widget - The widget descriptor for rendering
 * @returns A properly formatted UIToolResult
 */
export function createUIResult(
  data: unknown,
  textSummary: string,
  widget: WidgetDescriptor
): UIToolResult {
  const safeData = data === undefined ? null : data;

  return {
    content: [
      {
        type: "text",
        text: textSummary,
      },
    ],
    structuredContent: safeData,
    _meta: createWidgetMeta(widget),
  };
}
