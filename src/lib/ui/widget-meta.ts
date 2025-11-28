/**
 * Descriptor for a widget that can be rendered in ChatGPT
 */
export interface WidgetDescriptor {
  /** Unique identifier for the widget */
  id: string;
  /** MCP resource URI (e.g., "ui://widget/car-build-card") */
  uri: string;
  /** HTML template filename (e.g., "car-build-card.html") */
  templateFile: string;
  /** Message shown while the tool is being invoked */
  invoking: string;
  /** Message shown after the tool has been invoked */
  invoked: string;
}

/**
 * Creates OpenAI widget metadata for tool responses
 * @param widget - The widget descriptor
 * @returns Metadata object for _meta field in tool response
 */
export function createWidgetMeta(widget: WidgetDescriptor): Record<string, unknown> {
  return {
    "openai/outputTemplate": widget.uri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": true,
    "openai/resultCanProduceWidget": true,
  };
}
