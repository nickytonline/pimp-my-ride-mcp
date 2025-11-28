import { getConfig } from "../../config.ts";

/**
 * Descriptor for a widget that can be rendered in ChatGPT
 */
export interface WidgetDescriptor {
  /** Unique identifier for the widget */
  id: string;
  /** Filename of the widget bundle (e.g., "car-build-card.js") */
  filename: string;
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
  const config = getConfig();
  const templateUri = `${config.WIDGET_BASE_URL}/${widget.filename}`;

  return {
    "openai/outputTemplate": templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": true,
    "openai/resultCanProduceWidget": true,
  };
}
