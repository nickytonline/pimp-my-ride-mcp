import express from "express";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { createTextResult } from "./lib/utils.ts";
import { createErrorResult } from "./lib/errors.ts";
import { logger } from "./logger.ts";
import { getConfig } from "./config.ts";
import { createKV, type KV } from "./storage/index.ts";
import { resolveIdentity } from "./auth/pomerium.ts";
import {
  getCurrentBuild,
  updateCarConfig,
  updateDriverProfile,
  saveBuild,
  loadBuild,
  listBuilds,
  deleteBuild,
  getBuildDetails,
} from "./tools/builds.ts";
import {
  PERSONA_PERKS,
  ColorSchema,
  WheelTypeSchema,
  BodyKitSchema,
  DecalSchema,
  SpoilerSchema,
  ExhaustSchema,
  UnderglowSchema,
  DriverPersonaSchema,
} from "./domain/models.ts";

// Initialize KV storage
let kv: KV;

const getServer = (req: express.Request) => {
  const config = getConfig();
  const server = new McpServer({
    name: config.SERVER_NAME,
    version: config.SERVER_VERSION,
  });

  // Resolve user identity from Pomerium headers
  const identity = resolveIdentity(req);

  // Register tool: Get current build
  server.registerTool(
    "getCurrentBuild",
    {
      title: "Get Current Car Build",
      description:
        "Retrieve or create the user's active car build with all customizations",
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
      },
      inputSchema: {},
    },
    async () => {
      try {
        logger.info("Tool executed: getCurrentBuild", {
          userId: identity.userId,
        });
        const build = await getCurrentBuild(kv, identity);
        return createTextResult(build);
      } catch (error) {
        logger.error("Error in getCurrentBuild", {
          error,
          userId: identity.userId,
        });
        return createErrorResult(error);
      }
    },
  );

  // Register tool: Update car configuration
  server.registerTool(
    "updateCarConfig",
    {
      title: "Update Car Configuration",
      description: "Update car attributes like color, wheels, bodyKit, etc.",
      inputSchema: {
        color: z
          .enum([
            "red",
            "blue",
            "green",
            "yellow",
            "orange",
            "purple",
            "pink",
            "black",
            "white",
            "silver",
            "gold",
            "cyan",
            "magenta",
            "lime",
          ])
          .optional()
          .describe("Primary color of the car"),
        secondaryColor: z
          .enum([
            "red",
            "blue",
            "green",
            "yellow",
            "orange",
            "purple",
            "pink",
            "black",
            "white",
            "silver",
            "gold",
            "cyan",
            "magenta",
            "lime",
          ])
          .optional()
          .describe("Secondary/accent color"),
        wheels: z
          .enum([
            "stock",
            "sport",
            "racing",
            "offroad",
            "chrome",
            "neon",
            "spinner",
          ])
          .optional()
          .describe("Wheel type"),
        bodyKit: z
          .enum([
            "stock",
            "sport",
            "racing",
            "drift",
            "luxury",
            "rally",
            "muscle",
          ])
          .optional()
          .describe("Body kit style"),
        decal: z
          .enum([
            "none",
            "racing_stripes",
            "flames",
            "tribal",
            "camo",
            "carbon_fiber",
            "checkered",
            "sponsor",
            "custom",
          ])
          .optional()
          .describe("Decal/livery style"),
        spoiler: z
          .enum(["none", "stock", "sport", "racing", "gt_wing", "ducktail"])
          .optional()
          .describe("Spoiler type"),
        exhaust: z
          .enum(["stock", "sport", "racing", "dual", "quad", "side_exit"])
          .optional()
          .describe("Exhaust system"),
        underglow: z
          .enum(["none", "red", "blue", "green", "purple", "rainbow", "white"])
          .optional()
          .describe("Underglow lighting"),
        performance: z
          .object({
            power: z
              .number()
              .min(0)
              .max(100)
              .optional()
              .describe("Engine power (0-100)"),
            grip: z
              .number()
              .min(0)
              .max(100)
              .optional()
              .describe("Tire grip (0-100)"),
            aero: z
              .number()
              .min(0)
              .max(100)
              .optional()
              .describe("Aerodynamics (0-100)"),
            weight: z
              .number()
              .min(0)
              .max(100)
              .optional()
              .describe("Weight reduction (0-100, higher = lighter)"),
          })
          .optional()
          .describe("Performance characteristics"),
      },
    },
    async (args) => {
      try {
        logger.info("Tool executed: updateCarConfig", {
          userId: identity.userId,
          updates: args,
        });
        const build = await updateCarConfig(kv, identity, args);
        return createTextResult(build);
      } catch (error) {
        logger.error("Error in updateCarConfig", {
          error,
          userId: identity.userId,
        });
        return createErrorResult(error);
      }
    },
  );

  // Register tool: Update driver profile
  server.registerTool(
    "updateDriverProfile",
    {
      title: "Update Driver Profile",
      description: "Set driver persona and nickname",
      inputSchema: {
        persona: z
          .enum([
            "CoolCalmCollected",
            "RoadRage",
            "SpeedDemon",
            "Cautious",
            "ShowOff",
            "Tactical",
            "Wildcard",
          ])
          .optional()
          .describe("Driver personality and racing style"),
        nickname: z
          .string()
          .min(1)
          .max(50)
          .optional()
          .describe("Driver nickname"),
      },
    },
    async (args) => {
      try {
        logger.info("Tool executed: updateDriverProfile", {
          userId: identity.userId,
          updates: args,
        });
        const build = await updateDriverProfile(kv, identity, args);
        return createTextResult(build);
      } catch (error) {
        logger.error("Error in updateDriverProfile", {
          error,
          userId: identity.userId,
        });
        return createErrorResult(error);
      }
    },
  );

  // Register tool: Save build
  server.registerTool(
    "saveBuild",
    {
      title: "Save Car Build",
      description:
        "Save the current car build configuration under a specific name",
      inputSchema: {
        name: z.string().min(1).max(100).describe("Name for the saved build"),
      },
    },
    async (args) => {
      try {
        logger.info("Tool executed: saveBuild", {
          userId: identity.userId,
          name: args.name,
        });
        const build = await saveBuild(kv, identity, args.name);
        return createTextResult(build);
      } catch (error) {
        logger.error("Error in saveBuild", { error, userId: identity.userId });
        return createErrorResult(error);
      }
    },
  );

  // Register tool: Load build
  server.registerTool(
    "loadBuild",
    {
      title: "Load Car Build",
      description: "Load a saved car build and make it the active build",
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
      },
      inputSchema: {
        buildId: z.string().describe("ID of the build to load"),
      },
    },
    async (args) => {
      try {
        logger.info("Tool executed: loadBuild", {
          userId: identity.userId,
          buildId: args.buildId,
        });
        const build = await loadBuild(kv, identity, args.buildId);
        return createTextResult(build);
      } catch (error) {
        logger.error("Error in loadBuild", { error, userId: identity.userId });
        return createErrorResult(error);
      }
    },
  );

  // Register tool: List builds
  server.registerTool(
    "listBuilds",
    {
      title: "List Car Builds",
      description: "List all saved car builds for the user",
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
      },
      inputSchema: {
        limit: z
          .number()
          .min(1)
          .max(100)
          .optional()
          .describe("Maximum number of builds to return (default: 50)"),
        cursor: z
          .string()
          .optional()
          .describe("Pagination cursor from previous response"),
      },
    },
    async (args) => {
      try {
        logger.info("Tool executed: listBuilds", { userId: identity.userId });
        const result = await listBuilds(kv, identity, args);
        return createTextResult(result);
      } catch (error) {
        logger.error("Error in listBuilds", { error, userId: identity.userId });
        return createErrorResult(error);
      }
    },
  );

  // Register tool: Delete build
  server.registerTool(
    "deleteBuild",
    {
      title: "Delete Car Build",
      description: "Delete a saved car build (cannot delete active build)",
      inputSchema: {
        buildId: z.string().describe("ID of the build to delete"),
      },
    },
    async (args) => {
      try {
        logger.info("Tool executed: deleteBuild", {
          userId: identity.userId,
          buildId: args.buildId,
        });
        const deleted = await deleteBuild(kv, identity, args.buildId);
        return createTextResult({ deleted, buildId: args.buildId });
      } catch (error) {
        logger.error("Error in deleteBuild", {
          error,
          userId: identity.userId,
        });
        return createErrorResult(error);
      }
    },
  );

  // Register tool: Get build details
  server.registerTool(
    "getBuildDetails",
    {
      title: "Get Car Build Details",
      description:
        "Get detailed information about a car build including performance score",
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
      },
      inputSchema: {
        buildId: z
          .string()
          .optional()
          .describe("ID of the build (defaults to active build)"),
      },
    },
    async (args) => {
      try {
        logger.info("Tool executed: getBuildDetails", {
          userId: identity.userId,
          buildId: args.buildId,
        });
        const details = await getBuildDetails(kv, identity, args.buildId);
        return createTextResult(details);
      } catch (error) {
        logger.error("Error in getBuildDetails", {
          error,
          userId: identity.userId,
        });
        return createErrorResult(error);
      }
    },
  );

  // Register tool: Get customization options
  server.registerTool(
    "getCustomizationOptions",
    {
      title: "Get Customization Options",
      description:
        "Get all available car customization options (colors, wheels, body kits, etc.)",
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
      },
      inputSchema: {},
    },
    async () => {
      try {
        logger.info("Tool executed: getCustomizationOptions");
        const options = {
          colors: ColorSchema.options,
          wheels: WheelTypeSchema.options,
          bodyKits: BodyKitSchema.options,
          decals: DecalSchema.options,
          spoilers: SpoilerSchema.options,
          exhausts: ExhaustSchema.options,
          underglows: UnderglowSchema.options,
          driverPersonas: DriverPersonaSchema.options,
        };
        return createTextResult(options);
      } catch (error) {
        logger.error("Error in getCustomizationOptions", { error });
        return createErrorResult(error);
      }
    },
  );

  // Register tool: Get persona info
  server.registerTool(
    "getPersonaInfo",
    {
      title: "Get Driver Persona Info",
      description:
        "Get information about driver personas including racing style, strengths and weaknesses",
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
      },
      inputSchema: {
        persona: z
          .enum([
            "CoolCalmCollected",
            "RoadRage",
            "SpeedDemon",
            "Cautious",
            "ShowOff",
            "Tactical",
            "Wildcard",
          ])
          .optional()
          .describe(
            "Specific persona to get info for (returns all if not specified)",
          ),
      },
    },
    async (args) => {
      try {
        logger.info("Tool executed: getPersonaInfo", { persona: args.persona });
        if (args.persona) {
          return createTextResult({
            persona: args.persona,
            ...PERSONA_PERKS[args.persona],
          });
        }
        return createTextResult(PERSONA_PERKS);
      } catch (error) {
        logger.error("Error in getPersonaInfo", { error });
        return createErrorResult(error);
      }
    },
  );

  return server;
};

const app = express();
app.use(express.json());

const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

const mcpHandler = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  try {
    // Handle initialization requests (usually POST without session ID)
    if (req.method === "POST" && !sessionId && isInitializeRequest(req.body)) {
      logger.info("Initializing new MCP session");

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
          transports[sessionId] = transport;
          logger.info("MCP session initialized", { sessionId });
        },
      });

      const server = getServer(req);
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    // Handle existing session requests
    if (sessionId && transports[sessionId]) {
      const transport = transports[sessionId];
      await transport.handleRequest(req, res, req.body);
      return;
    }

    // Handle case where no session ID is provided for non-init requests
    if (req.method === "POST" && !sessionId) {
      logger.warn(
        "POST request without session ID for non-initialization request",
      );
      res
        .status(400)
        .json({ error: "Session ID required for non-initialization requests" });
      return;
    }

    // Handle unknown session
    if (sessionId && !transports[sessionId]) {
      logger.warn("Request for unknown session", { sessionId });
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // For GET requests without session, return server info
    if (req.method === "GET") {
      const config = getConfig();
      res.json({
        name: config.SERVER_NAME,
        version: config.SERVER_VERSION,
        description: "Pimp My Ride MCP Server - Car customization and racing",
        capabilities: ["tools"],
      });
    }
  } catch (error) {
    logger.error("Error handling MCP request", {
      error: error instanceof Error ? error.message : error,
    });
    res.status(500).json({ error: "Internal server error" });
  }
};

// Handle MCP requests on /mcp endpoint
app.post("/mcp", mcpHandler);
app.get("/mcp", mcpHandler);

// Healthcheck endpoint
app.get("/health", async (req, res) => {
  try {
    const healthy = await kv.healthcheck();
    if (healthy) {
      res.json({ status: "healthy", storage: "connected" });
    } else {
      res.status(503).json({ status: "unhealthy", storage: "disconnected" });
    }
  } catch (error) {
    logger.error("Healthcheck failed", {
      error: error instanceof Error ? error.message : error,
    });
    res.status(503).json({ status: "unhealthy", error: "healthcheck failed" });
  }
});

async function main() {
  const config = getConfig();

  // Ensure data directory exists for SQLite
  if (config.STORAGE_BACKEND === "sqlite") {
    const dataDir = dirname(config.SQLITE_DB_PATH);
    try {
      await mkdir(dataDir, { recursive: true });
      logger.info("Data directory ready", { path: dataDir });
    } catch (error) {
      logger.error("Failed to create data directory", {
        path: dataDir,
        error: error instanceof Error ? error.message : error,
      });
      process.exit(1);
    }
  }

  // Initialize KV storage
  logger.info("Initializing storage", { backend: config.STORAGE_BACKEND });
  kv = createKV({
    backend: config.STORAGE_BACKEND,
    sqlite: {
      filename: config.SQLITE_DB_PATH,
      verbose: config.SQLITE_VERBOSE,
    },
  });

  // Verify storage is healthy
  const healthy = await kv.healthcheck();
  if (!healthy) {
    logger.error("Storage healthcheck failed");
    process.exit(1);
  }
  logger.info("Storage initialized successfully");

  // Graceful shutdown handling
  const shutdown = async () => {
    logger.info("Shutting down gracefully");
    try {
      await kv.close();
      logger.info("Storage closed");
    } catch (error) {
      logger.error("Error closing storage", {
        error: error instanceof Error ? error.message : error,
      });
    }
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  app.listen(config.PORT, config.HOST, () => {
    logger.info("Pimp My Ride MCP Server running", {
      host: config.HOST,
      port: config.PORT,
      environment: config.NODE_ENV,
      serverName: config.SERVER_NAME,
      version: config.SERVER_VERSION,
      storage: config.STORAGE_BACKEND,
    });
  });
}

main().catch((error) => {
  logger.error("Server startup error", {
    error: error instanceof Error ? error.message : error,
  });
  process.exit(1);
});
