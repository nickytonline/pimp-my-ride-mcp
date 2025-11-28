import { z } from "zod";

const configSchema = z.object({
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  SERVER_NAME: z.string().default("pimp-my-ride-mcp"),
  SERVER_VERSION: z.string().default("1.0.0"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  // Storage configuration
  STORAGE_BACKEND: z
    .enum(["sqlite", "redis", "postgres", "dynamodb"])
    .default("sqlite"),
  SQLITE_DB_PATH: z.string().default("./data/pimp-my-ride.db"),
  SQLITE_VERBOSE: z.coerce.boolean().default(false),

  // UI Widget configuration
  // In production, should be set to your server's public URL (e.g., https://your-server.com/widgets)
  // In development with Vite dev server, use http://localhost:5173/widgets
  // For local testing without Vite, use http://localhost:3000/widgets
  WIDGET_BASE_URL: z
    .string()
    .url()
    .default("http://localhost:3000/widgets")
    .transform((url) => url.replace(/\/+$/, "")), // Strip trailing slashes
});

export type Config = z.infer<typeof configSchema>;

let config: Config;

export function getConfig(): Config {
  if (!config) {
    try {
      config = configSchema.parse(process.env);
    } catch (error) {
      console.error("❌ Invalid environment configuration:", error);
      process.exit(1);
    }
  }
  return config;
}

export function isProduction(): boolean {
  return getConfig().NODE_ENV === "production";
}

export function isDevelopment(): boolean {
  return getConfig().NODE_ENV === "development";
}
