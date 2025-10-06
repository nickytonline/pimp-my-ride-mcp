/**
 * Build management tools for Pomeranian Kart MCP Server
 * Handles car configuration, driver profiles, and build persistence
 */

import type { KV } from '../storage/index.ts';
import { KVHelpers } from '../storage/index.ts';
import type { UserIdentity } from '../auth/pomerium.ts';
import { canAccessBuild } from '../auth/pomerium.ts';
import {
  type Build,
  type BuildMetadata,
  type CarConfigUpdate,
  type DriverProfileUpdate,
  CarConfigUpdateSchema,
  DriverProfileUpdateSchema,
  createBuild,
  calculatePerformanceScore,
} from '../domain/models.ts';

const BUILDS_NAMESPACE = 'builds';
const ACTIVE_BUILD_KEY = 'active';

/**
 * Build storage key format: ${userId}:${buildId}
 */
function buildKey(userId: string, buildId: string): string {
  return `${userId}:${buildId}`;
}

/**
 * Get the current active build for a user, creating one if it doesn't exist
 */
export async function getCurrentBuild(
  kv: KV,
  identity: UserIdentity
): Promise<Build> {
  const key = buildKey(identity.userId, ACTIVE_BUILD_KEY);

  // Try to get existing active build
  const result = await KVHelpers.getJSON<Build>(kv, BUILDS_NAMESPACE, key);

  if (result) {
    return result.value;
  }

  // Create a new default build
  const newBuild = createBuild(ACTIVE_BUILD_KEY);
  await KVHelpers.setJSON(kv, BUILDS_NAMESPACE, key, newBuild);

  return newBuild;
}

/**
 * Update car configuration for the active build
 */
export async function updateCarConfig(
  kv: KV,
  identity: UserIdentity,
  updates: CarConfigUpdate
): Promise<Build> {
  // Validate updates
  const validatedUpdates = CarConfigUpdateSchema.parse(updates);

  // Get current build
  const build = await getCurrentBuild(kv, identity);

  // Apply updates
  build.car = { ...build.car, ...validatedUpdates };
  build.updatedAt = Date.now();

  // Save updated build
  const key = buildKey(identity.userId, ACTIVE_BUILD_KEY);
  await KVHelpers.setJSON(kv, BUILDS_NAMESPACE, key, build);

  return build;
}

/**
 * Update driver profile for the active build
 */
export async function updateDriverProfile(
  kv: KV,
  identity: UserIdentity,
  updates: DriverProfileUpdate
): Promise<Build> {
  // Validate updates
  const validatedUpdates = DriverProfileUpdateSchema.parse(updates);

  // Get current build
  const build = await getCurrentBuild(kv, identity);

  // Apply updates
  build.driver = { ...build.driver, ...validatedUpdates };
  build.updatedAt = Date.now();

  // Save updated build
  const key = buildKey(identity.userId, ACTIVE_BUILD_KEY);
  await KVHelpers.setJSON(kv, BUILDS_NAMESPACE, key, build);

  return build;
}

/**
 * Save the active build under a specific name
 */
export async function saveBuild(
  kv: KV,
  identity: UserIdentity,
  name: string
): Promise<Build> {
  // Get current active build
  const activeBuild = await getCurrentBuild(kv, identity);

  // Create a new build ID based on the name (sanitized)
  const buildId = sanitizeBuildId(name);

  // Check if a build with this name already exists
  const existingKey = buildKey(identity.userId, buildId);
  const existing = await KVHelpers.getJSON<Build>(kv, BUILDS_NAMESPACE, existingKey);

  if (existing) {
    throw new Error(`A build named "${name}" already exists`);
  }

  // Create the saved build
  const savedBuild: Build = {
    ...activeBuild,
    id: buildId,
    name,
    createdAt: activeBuild.createdAt,
    updatedAt: Date.now(),
  };

  // Save the build
  await KVHelpers.setJSON(kv, BUILDS_NAMESPACE, existingKey, savedBuild);

  return savedBuild;
}

/**
 * Load a saved build and make it the active build
 */
export async function loadBuild(
  kv: KV,
  identity: UserIdentity,
  buildId: string
): Promise<Build> {
  const key = buildKey(identity.userId, buildId);

  // Get the build
  const result = await KVHelpers.getJSON<Build>(kv, BUILDS_NAMESPACE, key);

  if (!result) {
    throw new Error(`Build "${buildId}" not found`);
  }

  const build = result.value;

  // Verify the user owns this build
  if (!canAccessBuild(identity, identity.userId)) {
    throw new Error('Access denied');
  }

  // Copy to active build
  const activeBuild: Build = {
    ...build,
    id: ACTIVE_BUILD_KEY,
    updatedAt: Date.now(),
  };

  const activeKey = buildKey(identity.userId, ACTIVE_BUILD_KEY);
  await KVHelpers.setJSON(kv, BUILDS_NAMESPACE, activeKey, activeBuild);

  return activeBuild;
}

/**
 * List all saved builds for a user
 */
export async function listBuilds(
  kv: KV,
  identity: UserIdentity,
  options?: { limit?: number; cursor?: string }
): Promise<{ builds: BuildMetadata[]; cursor: string | null }> {
  const { limit = 50, cursor } = options || {};

  // List all keys for this user
  const prefix = `${identity.userId}:`;
  const result = await kv.list(BUILDS_NAMESPACE, {
    prefix,
    limit,
    cursor,
  });

  // Fetch metadata for each build (excluding the active build)
  const builds: BuildMetadata[] = [];

  for (const fullKey of result.keys) {
    // Extract buildId from the key
    const buildId = fullKey.substring(prefix.length);

    // Skip the active build
    if (buildId === ACTIVE_BUILD_KEY) {
      continue;
    }

    // Get the build
    const buildResult = await KVHelpers.getJSON<Build>(kv, BUILDS_NAMESPACE, fullKey);

    if (buildResult) {
      const build = buildResult.value;
      builds.push({
        id: build.id,
        name: build.name,
        createdAt: build.createdAt,
        updatedAt: build.updatedAt,
      });
    }
  }

  return {
    builds,
    cursor: result.cursor,
  };
}

/**
 * Delete a saved build
 */
export async function deleteBuild(
  kv: KV,
  identity: UserIdentity,
  buildId: string
): Promise<boolean> {
  // Prevent deleting the active build
  if (buildId === ACTIVE_BUILD_KEY) {
    throw new Error('Cannot delete the active build');
  }

  const key = buildKey(identity.userId, buildId);
  return await kv.delete(BUILDS_NAMESPACE, key);
}

/**
 * Get build details including performance score
 */
export async function getBuildDetails(
  kv: KV,
  identity: UserIdentity,
  buildId: string = ACTIVE_BUILD_KEY
): Promise<Build & { performanceScore: number }> {
  const key = buildKey(identity.userId, buildId);

  const result = await KVHelpers.getJSON<Build>(kv, BUILDS_NAMESPACE, key);

  if (!result) {
    if (buildId === ACTIVE_BUILD_KEY) {
      // Create default build for active
      return {
        ...createBuild(ACTIVE_BUILD_KEY),
        performanceScore: 50,
      };
    }
    throw new Error(`Build "${buildId}" not found`);
  }

  const build = result.value;
  const performanceScore = calculatePerformanceScore(build.car);

  return {
    ...build,
    performanceScore,
  };
}

/**
 * Sanitize a build name to create a safe build ID
 */
function sanitizeBuildId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50);
}
