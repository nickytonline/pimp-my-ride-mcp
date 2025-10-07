/**
 * Pomerium authentication resolver
 * Extracts user identity from Pomerium proxy headers
 */

import type { Request } from "express";

/**
 * User identity extracted from Pomerium headers
 */
export interface UserIdentity {
  /** Unique user identifier (from Pomerium subject or user ID) */
  userId: string;
  /** User email (if available) */
  email?: string;
  /** Display name (if available) */
  name?: string;
  /** Whether the user is authenticated (vs anonymous) */
  authenticated: boolean;
}

/**
 * Pomerium header names
 * See: https://www.pomerium.com/docs/reference/forward-auth
 */
const POMERIUM_HEADERS = {
  // User identifier (typically email or subject)
  USER_ID: "x-pomerium-claim-sub",
  // User email
  EMAIL: "x-pomerium-claim-email",
  // Display name
  NAME: "x-pomerium-claim-name",
  // JWT assertion
  JWT: "x-pomerium-jwt-assertion",
} as const;

/**
 * Extract user identity from Pomerium headers
 * @param req - Express request object
 * @returns User identity or anonymous identity if headers are missing
 */
export function resolveIdentity(req: Request): UserIdentity {
  // Try to get user ID from Pomerium headers
  const userId = req.headers[POMERIUM_HEADERS.USER_ID] as string | undefined;
  const email = req.headers[POMERIUM_HEADERS.EMAIL] as string | undefined;
  const name = req.headers[POMERIUM_HEADERS.NAME] as string | undefined;

  // If we have a user ID, return authenticated identity
  if (userId) {
    return {
      userId: sanitizeUserId(userId),
      email,
      name,
      authenticated: true,
    };
  }

  // Log warning about anonymous access
  console.warn(
    "⚠️  Anonymous user detected - no Pomerium authentication headers found. In production, configure Pomerium proxy.",
  );

  // Fallback: check for JWT assertion
  const jwt = req.headers[POMERIUM_HEADERS.JWT] as string | undefined;
  if (jwt) {
    try {
      // Parse JWT (base64 decode the payload without verification)
      const payload = parseJWTPayload(jwt);
      if (payload.sub) {
        return {
          userId: sanitizeUserId(payload.sub),
          email: payload.email,
          name: payload.name,
          authenticated: true,
        };
      }
    } catch (error) {
      // JWT parsing failed, fall through to anonymous
    }
  }

  // Anonymous/dev mode: generate a session-based ID
  // In production, you might want to reject unauthenticated requests
  const anonymousId = generateAnonymousId(req);
  return {
    userId: anonymousId,
    authenticated: false,
  };
}

/**
 * Sanitize user ID to ensure it's safe for use as a key
 * Removes potentially problematic characters and normalizes format
 */
function sanitizeUserId(userId: string): string {
  // Remove any null bytes, newlines, or other control characters
  let sanitized = userId.replace(/[\x00-\x1F\x7F]/g, "");

  // Trim whitespace
  sanitized = sanitized.trim();

  // Ensure it's not empty after sanitization
  if (!sanitized) {
    throw new Error("Invalid user ID: empty after sanitization");
  }

  // Normalize to lowercase for consistency
  return sanitized.toLowerCase();
}

/**
 * Parse JWT payload without verification
 * WARNING: This does NOT verify the JWT signature. Only use with trusted sources (Pomerium)
 * @param jwt - JWT token string
 * @returns Decoded payload
 */
function parseJWTPayload(jwt: string): {
  sub?: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
} {
  const parts = jwt.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  const payload = parts[1];
  const decoded = Buffer.from(payload, "base64").toString("utf-8");
  return JSON.parse(decoded);
}

/**
 * Generate a deterministic anonymous ID based on request characteristics
 * This allows anonymous users to maintain a session across requests
 * In production, you might want to reject anonymous requests instead
 */
function generateAnonymousId(req: Request): string {
  // Use IP and User-Agent to generate a pseudo-stable anonymous ID
  const ip = req.ip || "unknown";
  const userAgent = req.headers["user-agent"] || "unknown";

  // Create a simple hash-like ID (not cryptographically secure, just for dev)
  const combined = `${ip}:${userAgent}`;
  const hash = Array.from(combined).reduce(
    (acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0,
    0,
  );

  return `anon_${Math.abs(hash).toString(36)}`;
}

/**
 * Middleware to require authentication
 * Throws an error if the user is not authenticated
 */
export function requireAuth(identity: UserIdentity): void {
  if (!identity.authenticated) {
    throw new Error(
      "Authentication required. Please configure Pomerium authentication.",
    );
  }
}

/**
 * Check if a user is allowed to access a build
 * @param identity - User identity
 * @param buildUserId - User ID that owns the build
 * @returns True if access is allowed
 */
export function canAccessBuild(
  identity: UserIdentity,
  buildUserId: string,
): boolean {
  return identity.userId === buildUserId;
}
