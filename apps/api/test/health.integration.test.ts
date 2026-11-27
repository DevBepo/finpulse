import { randomUUID } from "node:crypto";
import { healthResponseSchema } from "@finpulse/contracts";
import { expect, it } from "vitest";
import { createApp } from "../src/app.js";

function testDatabaseUrl() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "Set TEST_DATABASE_URL and start PostgreSQL with Docker Compose",
    );
  }
  return new URL(url);
}

it("reports healthy when the API can query the PostgreSQL test database", async () => {
  const app = createApp({ databaseUrl: testDatabaseUrl().href });

  try {
    const response = await app.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(200);
    expect(healthResponseSchema.parse(response.json())).toEqual({
      status: "ok",
      database: "up",
    });
  } finally {
    await app.close();
  }
});

it("returns the shared unavailable response when PostgreSQL rejects the connection", async () => {
  const databaseUrl = testDatabaseUrl();
  databaseUrl.pathname = `/missing_${randomUUID()}`;
  const app = createApp({ databaseUrl: databaseUrl.href });

  try {
    const response = await app.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(503);
    expect(healthResponseSchema.parse(response.json())).toEqual({
      status: "unavailable",
      database: "down",
    });
  } finally {
    await app.close();
  }
});
