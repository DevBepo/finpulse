import Fastify from "fastify";
import { registerHealthRoute } from "./adapters/http/health.js";
import { createPostgres } from "./adapters/persistence/postgres.js";

export function createApp({ databaseUrl }: { databaseUrl: string }) {
  const app = Fastify();
  const database = createPostgres(databaseUrl);

  app.addHook("onClose", database.close);
  registerHealthRoute(app, database.checkConnection);

  return app;
}
