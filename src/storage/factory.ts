/**
 * Factory function for creating KV storage instances
 * Supports multiple backends (SQLite by default, extensible to Redis, PostgreSQL, DynamoDB, etc.)
 */

import type { KV } from "./kv.ts";
import { SQLiteKV, type SQLiteKVOptions } from "./sqlite.ts";

/**
 * Supported storage backend types
 */
export type StorageBackend = "sqlite" | "redis" | "postgres" | "dynamodb";

/**
 * Configuration options for the KV factory
 */
export interface KVFactoryOptions {
  /** Storage backend type (default: 'sqlite') */
  backend?: StorageBackend;
  /** SQLite-specific options */
  sqlite?: SQLiteKVOptions;
  // Future: Add options for other backends
  // redis?: RedisKVOptions;
  // postgres?: PostgresKVOptions;
  // dynamodb?: DynamoKVOptions;
}

/**
 * Create a KV storage instance based on the provided configuration
 * @param options - Factory configuration options
 * @returns KV storage instance
 * @throws Error if the backend is not supported
 */
export function createKV(options: KVFactoryOptions = {}): KV {
  const { backend = "sqlite" } = options;

  switch (backend) {
    case "sqlite":
      return new SQLiteKV(options.sqlite);

    case "redis":
      throw new Error(
        "Redis backend not yet implemented. Please use SQLite or implement RedisKV adapter.",
      );

    case "postgres":
      throw new Error(
        "PostgreSQL backend not yet implemented. Please use SQLite or implement PostgresKV adapter.",
      );

    case "dynamodb":
      throw new Error(
        "DynamoDB backend not yet implemented. Please use SQLite or implement DynamoKV adapter.",
      );

    default:
      throw new Error(`Unsupported storage backend: ${backend}`);
  }
}
