import type { WidgetDescriptor } from "../lib/ui/widget-meta.ts";

/**
 * Registry of all available widgets
 * Each widget has a unique ID, resource URI (ui:// format), template file, and loading/completion messages
 */
export const WIDGETS: Record<string, WidgetDescriptor> = {
  carBuildCard: {
    id: "car_build_card",
    uri: "ui://widget/car-build-card",
    templateFile: "car-build-card.html",
    invoking: "Loading your car build...",
    invoked: "Here's your customized ride!",
  },
  buildList: {
    id: "build_list",
    uri: "ui://widget/build-list",
    templateFile: "build-list.html",
    invoking: "Fetching your saved builds...",
    invoked: "Here are your saved builds!",
  },
  personaCard: {
    id: "persona_card",
    uri: "ui://widget/persona-card",
    templateFile: "persona-card.html",
    invoking: "Loading driver persona info...",
    invoked: "Here's the driver persona!",
  },
  optionsGrid: {
    id: "options_grid",
    uri: "ui://widget/options-grid",
    templateFile: "options-grid.html",
    invoking: "Loading customization options...",
    invoked: "Here are your customization options!",
  },
} as const;
