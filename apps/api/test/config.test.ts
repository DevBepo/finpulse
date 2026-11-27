import { expect, it } from "vitest";
import { readConfig } from "../src/config.js";

const databaseUrl = "postgresql://finpulse@127.0.0.1/finpulse_dev";

it("defaults APP_TIMEZONE to São Paulo and starts the API on port 3000", () => {
  expect(readConfig({ DATABASE_URL: databaseUrl })).toEqual({
    databaseUrl,
    timeZone: "America/Sao_Paulo",
    port: 3000,
  });
});

it("rejects invalid database URLs, timezones, and TCP ports at startup", () => {
  expect(() =>
    readConfig({
      DATABASE_URL: "https://example.com/finpulse_dev",
      APP_TIMEZONE: "Brazil/Imaginary",
      API_PORT: "65536",
    }),
  ).toThrow(/DATABASE_URL[\s\S]*APP_TIMEZONE[\s\S]*API_PORT/);
});
