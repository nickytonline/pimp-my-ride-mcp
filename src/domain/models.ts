/**
 * Domain models for Pomeranian Kart
 * Includes car configuration, driver profiles, and build management
 */

import { z } from 'zod';

/**
 * Color options for car customization
 */
export const ColorSchema = z.enum([
  'red',
  'blue',
  'green',
  'yellow',
  'orange',
  'purple',
  'pink',
  'black',
  'white',
  'silver',
  'gold',
  'cyan',
  'magenta',
  'lime',
]);

export type Color = z.infer<typeof ColorSchema>;

/**
 * Wheel options
 */
export const WheelTypeSchema = z.enum([
  'stock',
  'sport',
  'racing',
  'offroad',
  'chrome',
  'neon',
  'spinner',
]);

export type WheelType = z.infer<typeof WheelTypeSchema>;

/**
 * Body kit options
 */
export const BodyKitSchema = z.enum([
  'stock',
  'sport',
  'racing',
  'drift',
  'luxury',
  'rally',
  'muscle',
]);

export type BodyKit = z.infer<typeof BodyKitSchema>;

/**
 * Decal/livery options
 */
export const DecalSchema = z.enum([
  'none',
  'racing_stripes',
  'flames',
  'tribal',
  'camo',
  'carbon_fiber',
  'checkered',
  'sponsor',
  'custom',
]);

export type Decal = z.infer<typeof DecalSchema>;

/**
 * Spoiler options
 */
export const SpoilerSchema = z.enum([
  'none',
  'stock',
  'sport',
  'racing',
  'gt_wing',
  'ducktail',
]);

export type Spoiler = z.infer<typeof SpoilerSchema>;

/**
 * Exhaust options
 */
export const ExhaustSchema = z.enum([
  'stock',
  'sport',
  'racing',
  'dual',
  'quad',
  'side_exit',
]);

export type Exhaust = z.infer<typeof ExhaustSchema>;

/**
 * Underglow options
 */
export const UnderglowSchema = z.enum([
  'none',
  'red',
  'blue',
  'green',
  'purple',
  'rainbow',
  'white',
]);

export type Underglow = z.infer<typeof UnderglowSchema>;

/**
 * Performance characteristics
 */
export const PerformanceSchema = z.object({
  /** Engine power (0-100) */
  power: z.number().min(0).max(100).default(50),
  /** Tire grip (0-100) */
  grip: z.number().min(0).max(100).default(50),
  /** Aerodynamics (0-100) */
  aero: z.number().min(0).max(100).default(50),
  /** Weight reduction (0-100, higher = lighter) */
  weight: z.number().min(0).max(100).default(50),
});

export type Performance = z.infer<typeof PerformanceSchema>;

/**
 * Car configuration
 */
export const CarConfigSchema = z.object({
  color: ColorSchema.default('red'),
  secondaryColor: ColorSchema.optional(),
  wheels: WheelTypeSchema.default('stock'),
  bodyKit: BodyKitSchema.default('stock'),
  decal: DecalSchema.default('none'),
  spoiler: SpoilerSchema.default('none'),
  exhaust: ExhaustSchema.default('stock'),
  underglow: UnderglowSchema.default('none'),
  performance: PerformanceSchema.default({
    power: 50,
    grip: 50,
    aero: 50,
    weight: 50,
  }),
});

export type CarConfig = z.infer<typeof CarConfigSchema>;

/**
 * Driver persona types
 */
export const DriverPersonaSchema = z.enum([
  'CoolCalmCollected',
  'RoadRage',
  'SpeedDemon',
  'Cautious',
  'ShowOff',
  'Tactical',
  'Wildcard',
]);

export type DriverPersona = z.infer<typeof DriverPersonaSchema>;

/**
 * Driver profile
 */
export const DriverProfileSchema = z.object({
  persona: DriverPersonaSchema.default('CoolCalmCollected'),
  nickname: z.string().min(1).max(50).optional(),
});

export type DriverProfile = z.infer<typeof DriverProfileSchema>;

/**
 * Complete build (car + driver)
 */
export const BuildSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  car: CarConfigSchema,
  driver: DriverProfileSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Build = z.infer<typeof BuildSchema>;

/**
 * Partial car config update (all fields optional)
 */
export const CarConfigUpdateSchema = CarConfigSchema.partial();

export type CarConfigUpdate = z.infer<typeof CarConfigUpdateSchema>;

/**
 * Partial driver profile update (all fields optional)
 */
export const DriverProfileUpdateSchema = DriverProfileSchema.partial();

export type DriverProfileUpdate = z.infer<typeof DriverProfileUpdateSchema>;

/**
 * Build metadata for listing
 */
export const BuildMetadataSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type BuildMetadata = z.infer<typeof BuildMetadataSchema>;

/**
 * Persona perks and characteristics
 */
export const PERSONA_PERKS: Record<
  DriverPersona,
  { description: string; strengths: string[]; weaknesses: string[] }
> = {
  CoolCalmCollected: {
    description: 'Steady and consistent, rarely makes mistakes',
    strengths: ['Consistent lap times', 'Good under pressure', 'Smooth cornering'],
    weaknesses: ['Not the fastest top speed', 'Conservative overtaking'],
  },
  RoadRage: {
    description: 'Aggressive and unpredictable, high risk high reward',
    strengths: ['Aggressive overtaking', 'High top speed', 'Intimidating presence'],
    weaknesses: ['Prone to crashes', 'Inconsistent', 'Burns tires quickly'],
  },
  SpeedDemon: {
    description: 'All about top speed and acceleration',
    strengths: ['Highest top speed', 'Quick acceleration', 'Dominates straights'],
    weaknesses: ['Poor cornering', 'Struggles on technical tracks', 'High fuel consumption'],
  },
  Cautious: {
    description: 'Safety first, rarely crashes',
    strengths: ['No crashes', 'Excellent fuel economy', 'Good tire management'],
    weaknesses: ['Slowest lap times', 'Easily overtaken', 'Too defensive'],
  },
  ShowOff: {
    description: 'Style over substance, loves drifts and tricks',
    strengths: ['Spectacular drifts', 'Crowd favorite', 'Unpredictable lines'],
    weaknesses: ['Wastes time on style', 'Burns tires', 'Inconsistent'],
  },
  Tactical: {
    description: 'Strategic and calculated, optimizes every move',
    strengths: ['Perfect pit strategy', 'Overtakes at the right moment', 'Adapts to conditions'],
    weaknesses: ['Overthinks', 'Can be too conservative', 'Slow to react'],
  },
  Wildcard: {
    description: 'Completely unpredictable, anything can happen',
    strengths: ['Random boosts', 'Surprising overtakes', 'Chaos factor'],
    weaknesses: ['Random crashes', 'Inconsistent', 'Hard to predict'],
  },
};

/**
 * Helper to create a default car config
 */
export function createDefaultCarConfig(): CarConfig {
  return CarConfigSchema.parse({});
}

/**
 * Helper to create a default driver profile
 */
export function createDefaultDriverProfile(): DriverProfile {
  return DriverProfileSchema.parse({});
}

/**
 * Helper to create a new build
 */
export function createBuild(
  id: string,
  name?: string,
  car?: Partial<CarConfig>,
  driver?: Partial<DriverProfile>
): Build {
  const now = Date.now();
  return BuildSchema.parse({
    id,
    name,
    car: car ? { ...createDefaultCarConfig(), ...car } : createDefaultCarConfig(),
    driver: driver ? { ...createDefaultDriverProfile(), ...driver } : createDefaultDriverProfile(),
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * Calculate derived performance score from car config
 */
export function calculatePerformanceScore(car: CarConfig): number {
  const { power, grip, aero, weight } = car.performance;

  // Base score from performance stats
  let score = (power + grip + aero + weight) / 4;

  // Body kit bonuses
  const bodyKitBonus: Record<BodyKit, number> = {
    stock: 0,
    sport: 5,
    racing: 10,
    drift: 7,
    luxury: 3,
    rally: 8,
    muscle: 6,
  };
  score += bodyKitBonus[car.bodyKit];

  // Wheel bonuses
  const wheelBonus: Record<WheelType, number> = {
    stock: 0,
    sport: 3,
    racing: 8,
    offroad: 5,
    chrome: 1,
    neon: 2,
    spinner: 0,
  };
  score += wheelBonus[car.wheels];

  // Spoiler bonuses
  const spoilerBonus: Record<Spoiler, number> = {
    none: 0,
    stock: 2,
    sport: 4,
    racing: 7,
    gt_wing: 9,
    ducktail: 5,
  };
  score += spoilerBonus[car.spoiler];

  return Math.min(100, Math.round(score));
}
