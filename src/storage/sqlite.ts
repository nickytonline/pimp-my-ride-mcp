/**
 * SQLite implementation of the KV storage interface
 * Uses better-sqlite3 with WAL mode for better concurrency
 * Supports CAS (Compare-And-Set) versioning and TTL expiration
 */

import Database from 'better-sqlite3';
import type {
  KV,
  GetOptions,
  SetOptions,
  ListOptions,
  GetResult,
  ListResult,
  ValueMetadata,
} from './kv.ts';

/**
 * Configuration options for SQLiteKV
 */
export interface SQLiteKVOptions {
  /** Path to the SQLite database file (defaults to ':memory:' for in-memory database) */
  filename?: string;
  /** Enable verbose logging for SQL statements */
  verbose?: boolean;
}

/**
 * SQLite-backed KV storage with WAL mode, CAS versioning, and TTL support
 */
export class SQLiteKV implements KV {
  #db: Database.Database;

  constructor(options: SQLiteKVOptions = {}) {
    const { filename = ':memory:', verbose = false } = options;

    // Initialize database with WAL mode for better concurrency
    this.#db = new Database(filename, { verbose: verbose ? console.log : undefined });

    // Enable WAL mode for better write concurrency
    this.#db.pragma('journal_mode = WAL');

    // Initialize schema
    this.#initSchema();
  }

  /**
   * Initialize the database schema
   */
  #initSchema(): void {
    this.#db.exec(`
      CREATE TABLE IF NOT EXISTS kv (
        ns TEXT NOT NULL,
        key TEXT NOT NULL,
        value BLOB NOT NULL,
        content_type TEXT NOT NULL DEFAULT 'application/json',
        version INTEGER NOT NULL DEFAULT 1,
        expires_at INTEGER,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (ns, key)
      );

      CREATE INDEX IF NOT EXISTS idx_kv_ns_key ON kv(ns, key);
      CREATE INDEX IF NOT EXISTS idx_kv_expires_at ON kv(expires_at) WHERE expires_at IS NOT NULL;
    `);
  }

  /**
   * Clean up expired entries (called during get operations)
   */
  #cleanupExpired(ns: string, key: string): void {
    const now = Date.now();
    this.#db
      .prepare('DELETE FROM kv WHERE ns = ? AND key = ? AND expires_at IS NOT NULL AND expires_at <= ?')
      .run(ns, key, now);
  }

  async get<T = unknown>(
    ns: string,
    key: string,
    options?: GetOptions
  ): Promise<GetResult<T> | null> {
    // Clean up expired entry
    this.#cleanupExpired(ns, key);

    const row = this.#db
      .prepare(
        `SELECT value, content_type, version, expires_at, updated_at
         FROM kv
         WHERE ns = ? AND key = ?`
      )
      .get(ns, key) as
      | {
          value: Buffer;
          content_type: string;
          version: number;
          expires_at: number | null;
          updated_at: number;
        }
      | undefined;

    if (!row) {
      return null;
    }

    // Check content type filter
    if (options?.contentType && row.content_type !== options.contentType) {
      return null;
    }

    // Parse value based on content type
    let value: T;
    if (row.content_type === 'application/json') {
      value = JSON.parse(row.value.toString('utf-8')) as T;
    } else {
      value = row.value as T;
    }

    const metadata: ValueMetadata = {
      version: row.version,
      expiresAt: row.expires_at,
      updatedAt: row.updated_at,
      contentType: row.content_type,
    };

    return { value, metadata };
  }

  async set(
    ns: string,
    key: string,
    value: unknown,
    options?: SetOptions
  ): Promise<number> {
    const { ttl, contentType = 'application/json', cas } = options || {};
    const now = Date.now();
    const expiresAt = ttl ? now + ttl * 1000 : null;

    // Serialize value based on content type
    let serialized: Buffer;
    if (contentType === 'application/json') {
      serialized = Buffer.from(JSON.stringify(value), 'utf-8');
    } else {
      serialized = value as Buffer;
    }

    // Handle CAS (Compare-And-Set)
    if (cas !== undefined) {
      const current = await this.get(ns, key);

      if (current === null) {
        throw new Error(
          `CAS failed: key ${ns}:${key} does not exist (expected version ${cas})`
        );
      }

      if (current.metadata.version !== cas) {
        throw new Error(
          `CAS failed: version mismatch for ${ns}:${key} (expected ${cas}, got ${current.metadata.version})`
        );
      }

      // Update with version increment
      const info = this.#db
        .prepare(
          `UPDATE kv
           SET value = ?, content_type = ?, version = version + 1, expires_at = ?, updated_at = ?
           WHERE ns = ? AND key = ? AND version = ?`
        )
        .run(serialized, contentType, expiresAt, now, ns, key, cas);

      if (info.changes === 0) {
        throw new Error(
          `CAS failed: concurrent update detected for ${ns}:${key}`
        );
      }

      return cas + 1;
    }

    // Upsert without CAS
    const result = this.#db
      .prepare(
        `INSERT INTO kv (ns, key, value, content_type, version, expires_at, updated_at)
         VALUES (?, ?, ?, ?, 1, ?, ?)
         ON CONFLICT(ns, key) DO UPDATE SET
           value = excluded.value,
           content_type = excluded.content_type,
           version = version + 1,
           expires_at = excluded.expires_at,
           updated_at = excluded.updated_at
         RETURNING version`
      )
      .get(ns, key, serialized, contentType, expiresAt, now) as { version: number };

    return result.version;
  }

  async delete(ns: string, key: string): Promise<boolean> {
    const info = this.#db
      .prepare('DELETE FROM kv WHERE ns = ? AND key = ?')
      .run(ns, key);

    return info.changes > 0;
  }

  async list(ns: string, options?: ListOptions): Promise<ListResult> {
    const { limit = 100, cursor, prefix } = options || {};

    // Parse cursor (base64 encoded key)
    const startKey = cursor ? Buffer.from(cursor, 'base64').toString('utf-8') : '';

    // Build query with prefix filter
    let query = 'SELECT key FROM kv WHERE ns = ?';
    const params: (string | number)[] = [ns];

    if (prefix) {
      query += ' AND key LIKE ?';
      params.push(`${prefix}%`);
    }

    if (startKey) {
      query += ' AND key > ?';
      params.push(startKey);
    }

    query += ' ORDER BY key LIMIT ?';
    params.push(limit + 1); // Fetch one extra to determine if there are more results

    const now = Date.now();
    query = `SELECT key FROM (${query}) WHERE NOT EXISTS (
      SELECT 1 FROM kv WHERE ns = ? AND key = kv.key AND expires_at IS NOT NULL AND expires_at <= ?
    )`;
    params.push(ns, now);

    const rows = this.#db.prepare(query).all(...params) as { key: string }[];

    // Determine if there are more results
    const hasMore = rows.length > limit;
    const keys = hasMore ? rows.slice(0, limit).map((r) => r.key) : rows.map((r) => r.key);

    // Generate next cursor
    const nextCursor = hasMore
      ? Buffer.from(keys[keys.length - 1]).toString('base64')
      : null;

    return { keys, cursor: nextCursor };
  }

  async healthcheck(): Promise<boolean> {
    try {
      // Try a simple query to verify database is accessible
      this.#db.prepare('SELECT 1').get();
      return true;
    } catch (error) {
      return false;
    }
  }

  async close(): Promise<void> {
    this.#db.close();
  }

  /**
   * Manually trigger cleanup of all expired entries
   * This can be called periodically in production environments
   */
  cleanupAllExpired(): number {
    const now = Date.now();
    const info = this.#db
      .prepare('DELETE FROM kv WHERE expires_at IS NOT NULL AND expires_at <= ?')
      .run(now);

    return info.changes;
  }

  /**
   * Get database statistics
   */
  getStats(): {
    totalEntries: number;
    expiredEntries: number;
    namespaces: number;
  } {
    const now = Date.now();

    const totalEntries = (
      this.#db.prepare('SELECT COUNT(*) as count FROM kv').get() as { count: number }
    ).count;

    const expiredEntries = (
      this.#db
        .prepare('SELECT COUNT(*) as count FROM kv WHERE expires_at IS NOT NULL AND expires_at <= ?')
        .get(now) as { count: number }
    ).count;

    const namespaces = (
      this.#db.prepare('SELECT COUNT(DISTINCT ns) as count FROM kv').get() as {
        count: number;
      }
    ).count;

    return { totalEntries, expiredEntries, namespaces };
  }
}
