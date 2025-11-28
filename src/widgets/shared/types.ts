/**
 * Shared types for widget components
 * These mirror the domain models but without Zod dependencies
 */

export type Color =
  | "red" | "blue" | "green" | "yellow" | "orange" | "purple"
  | "pink" | "black" | "white" | "silver" | "gold" | "cyan"
  | "magenta" | "lime";

export type WheelType = "stock" | "sport" | "racing" | "offroad" | "chrome" | "neon" | "spinner";

export type BodyKit = "stock" | "sport" | "racing" | "drift" | "luxury" | "rally" | "muscle";

export type Decal = "none" | "racing_stripes" | "flames" | "tribal" | "camo" | "carbon_fiber" | "checkered" | "sponsor" | "custom";

export type Spoiler = "none" | "stock" | "sport" | "racing" | "gt_wing" | "ducktail";

export type Exhaust = "stock" | "sport" | "racing" | "dual" | "quad" | "side_exit";

export type Underglow = "none" | "red" | "blue" | "green" | "purple" | "rainbow" | "white";

export type DriverPersona = "CoolCalmCollected" | "RoadRage" | "SpeedDemon" | "Cautious" | "ShowOff" | "Tactical" | "Wildcard";

export interface Performance {
  power: number;
  grip: number;
  aero: number;
  weight: number;
}

export interface CarConfig {
  color: Color;
  secondaryColor?: Color;
  wheels: WheelType;
  bodyKit: BodyKit;
  decal: Decal;
  spoiler: Spoiler;
  exhaust: Exhaust;
  underglow: Underglow;
  performance: Performance;
}

export interface DriverProfile {
  persona: DriverPersona;
  nickname?: string;
}

export interface Build {
  id: string;
  name?: string;
  car: CarConfig;
  driver: DriverProfile;
  createdAt: number;
  updatedAt: number;
}

export interface BuildMetadata {
  id: string;
  name?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BuildListResult {
  builds: BuildMetadata[];
  cursor?: string;
  hasMore: boolean;
}

export interface PersonaPerk {
  description: string;
  strengths: string[];
  weaknesses: string[];
}

export interface CustomizationOptions {
  colors: Color[];
  wheels: WheelType[];
  bodyKits: BodyKit[];
  decals: Decal[];
  spoilers: Spoiler[];
  exhausts: Exhaust[];
  underglows: Underglow[];
  driverPersonas: DriverPersona[];
}

/**
 * OpenAI global object injected into widget iframe
 */
export interface OpenAIGlobal {
  structuredContent: unknown;
  theme?: "light" | "dark";
  locale?: string;
}

declare global {
  interface Window {
    openai?: OpenAIGlobal;
  }
}
