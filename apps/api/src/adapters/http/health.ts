import {
  type HealthResponse,
  healthResponseSchema,
  healthStatusCodes,
} from "@finpulse/contracts";
import type { FastifyInstance } from "fastify";

export function registerHealthRoute(
  app: FastifyInstance,
  checkDatabase: () => Promise<void>,
) {
  app.get("/api/health", async (_request, reply) => {
    let health: HealthResponse;
    try {
      await checkDatabase();
      health = { status: "ok", database: "up" };
    } catch {
      health = { status: "unavailable", database: "down" };
    }

    reply
      .header("Cache-Control", "no-store")
      .code(healthStatusCodes[health.status]);
    return healthResponseSchema.parse(health);
  });
}
