import {
  type HealthResponse,
  healthResponseSchema,
  healthStatusCodes,
} from "@finpulse/contracts";
import type { FastifyInstance } from "fastify";

function getErrorReason(error: unknown): string {
  const rootError =
    error instanceof Error && error.cause instanceof Error
      ? error.cause
      : error;
  if (!(rootError instanceof Error)) {
    return "Unknown database error";
  }
  if (rootError.message) {
    return rootError.message;
  }
  if (
    "code" in rootError &&
    typeof rootError.code === "string" &&
    rootError.code.length > 0
  ) {
    return rootError.code;
  }
  if (
    rootError instanceof AggregateError &&
    rootError.errors[0] instanceof Error &&
    rootError.errors[0].message
  ) {
    return rootError.errors[0].message;
  }
  return error instanceof Error && error.message
    ? error.message
    : "Unknown database error";
}

export function registerHealthRoute(
  app: FastifyInstance,
  checkDatabase: () => Promise<void>,
) {
  app.get("/api/health", async (request, reply) => {
    let health: HealthResponse;
    try {
      await checkDatabase();
      health = { status: "ok", database: "up" };
    } catch (error) {
      request.log.warn(
        { reason: getErrorReason(error) },
        "Database health check failed",
      );
      health = { status: "unavailable", database: "down" };
    }

    reply
      .header("Cache-Control", "no-store")
      .code(healthStatusCodes[health.status]);
    return healthResponseSchema.parse(health);
  });
}
