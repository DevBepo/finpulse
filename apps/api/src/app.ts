import Fastify from "fastify";
import { registerHealthRoute } from "./adapters/http/health.js";
import { createPostgres } from "./adapters/persistence/postgres.js";

export function createApp({
  databaseUrl,
  logger = false,
  healthCheckTimeoutMs,
}: {
  databaseUrl: string;
  logger?: boolean;
  healthCheckTimeoutMs?: number;
}) {
  const app = Fastify({ logger });
  const database = createPostgres(databaseUrl, { healthCheckTimeoutMs });

  app.addHook("onClose", database.close);
  registerHealthRoute(app, database.checkConnection);

  return app;
}
