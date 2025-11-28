import type { WidgetDescriptor } from "../lib/ui/widget-meta.ts";

/**
 * Registry of all available widgets
 * Each widget has a unique ID, filename, and loading/completion messages
 */
export const WIDGETS: Record<string, WidgetDescriptor> = {
  carBuildCard: {
    id: "car_build_card",
    filename: "car-build-card.js",
    invoking: "Loading your car build...",
    invoked: "Here's your customized ride!",
  },
  buildList: {
    id: "build_list",
    filename: "build-list.js",
    invoking: "Fetching your saved builds...",
    invoked: "Here are your saved builds!",
  },
  personaCard: {
    id: "persona_card",
    filename: "persona-card.js",
    invoking: "Loading driver persona info...",
    invoked: "Here's the driver persona!",
  },
  optionsGrid: {
    id: "options_grid",
    filename: "options-grid.js",
    invoking: "Loading customization options...",
    invoked: "Here are your customization options!",
  },
} as const;
