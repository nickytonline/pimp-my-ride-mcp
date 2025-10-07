/**
 * Key-Value storage abstraction with support for namespaces, TTL, CAS versioning, and pagination.
 * Provides a flexible interface that can be implemented by various storage backends (SQLite, Redis, PostgreSQL, DynamoDB, etc.)
 */

/**
 * Options for getting a value from the KV store
 */
export interface GetOptions {
  /** Content type filter (e.g., 'application/json') */
  contentType?: string;
}

/**
 * Options for setting a value in the KV store
 */
export interface SetOptions {
  /** Time-to-live in seconds. If set, the key will expire after this duration */
  ttl?: number;
  /** Content type (default: 'application/json') */
  contentType?: string;
  /** Expected version for Compare-And-Set. If provided, the update will only succeed if the current version matches */
  cas?: number;
}

/**
 * Options for listing keys in the KV store
 */
export interface ListOptions {
  /** Maximum number of keys to return (pagination limit) */
  limit?: number;
  /** Pagination cursor from a previous list operation */
  cursor?: string;
  /** Key prefix filter */
  prefix?: string;
}

/**
 * Metadata for a stored value
 */
export interface ValueMetadata {
  /** Current version number (incremented on each update) */
  version: number;
  /** Unix timestamp when the value expires (null if no expiration) */
  expiresAt: number | null;
  /** Unix timestamp when the value was last updated */
  updatedAt: number;
  /** Content type of the stored value */
  contentType: string;
}

/**
 * Result from a get operation
 */
export interface GetResult<T = unknown> {
  /** The stored value */
  value: T;
  /** Metadata about the value */
  metadata: ValueMetadata;
}

/**
 * Result from a list operation
 */
export interface ListResult {
  /** Array of keys matching the query */
  keys: string[];
  /** Cursor for the next page of results (null if no more results) */
  cursor: string | null;
}

/**
 * KV storage interface supporting multiple backends
 */
export interface KV {
  /**
   * Get a value from the store
   * @param ns - Namespace
   * @param key - Key within the namespace
   * @param options - Get options
   * @returns The value and metadata, or null if not found or expired
   */
  get<T = unknown>(
    ns: string,
    key: string,
    options?: GetOptions,
  ): Promise<GetResult<T> | null>;

  /**
   * Set a value in the store
   * @param ns - Namespace
   * @param key - Key within the namespace
   * @param value - Value to store
   * @param options - Set options (TTL, content type, CAS)
   * @returns The new version number
   * @throws Error if CAS version mismatch
   */
  set(
    ns: string,
    key: string,
    value: unknown,
    options?: SetOptions,
  ): Promise<number>;

  /**
   * Delete a value from the store
   * @param ns - Namespace
   * @param key - Key within the namespace
   * @returns True if the key was deleted, false if it didn't exist
   */
  delete(ns: string, key: string): Promise<boolean>;

  /**
   * List keys in a namespace
   * @param ns - Namespace
   * @param options - List options (limit, cursor, prefix)
   * @returns List result with keys and pagination cursor
   */
  list(ns: string, options?: ListOptions): Promise<ListResult>;

  /**
   * Check if the storage is healthy and accessible
   * @returns True if healthy, false otherwise
   */
  healthcheck(): Promise<boolean>;

  /**
   * Close the storage connection and clean up resources
   */
  close(): Promise<void>;
}

/**
 * Helper methods for JSON serialization/deserialization
 */
export const KVHelpers = {
  /**
   * Get and parse a JSON value
   */
  async getJSON<T = unknown>(
    kv: KV,
    ns: string,
    key: string,
  ): Promise<GetResult<T> | null> {
    return kv.get<T>(ns, key, { contentType: "application/json" });
  },

  /**
   * Set a JSON value
   */
  async setJSON<T = unknown>(
    kv: KV,
    ns: string,
    key: string,
    value: T,
    options?: Omit<SetOptions, "contentType">,
  ): Promise<number> {
    return kv.set(ns, key, value, {
      ...options,
      contentType: "application/json",
    });
  },
};
