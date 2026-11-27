import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export function createPostgres(databaseUrl: string) {
  const client = postgres(databaseUrl, { connect_timeout: 2 });
  const database = drizzle(client);

  return {
    async checkConnection() {
      await database.execute(sql`select 1`);
    },
    async close() {
      await client.end({ timeout: 2 });
    },
  };
}
