import { inspect } from "node:util";
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

it("reads explicit timezone and port settings", () => {
  expect(
    readConfig({
      DATABASE_URL: databaseUrl,
      APP_TIMEZONE: "UTC",
      API_PORT: "4000",
    }),
  ).toEqual({
    databaseUrl,
    timeZone: "UTC",
    port: 4000,
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

  for (const invalidUrl of [
    "postgresql://finpulse@127.0.0.1",
    "postgresql://finpulse@127.0.0.1/",
    "postgresql://finpulse@127.0.0.1//",
  ]) {
    expect(() => readConfig({ DATABASE_URL: invalidUrl })).toThrow(
      /DATABASE_URL/,
    );
  }
});

it("does not leak DATABASE_URL credentials when the URL is malformed", () => {
  const placeholderSecret = "placeholder_secret_password_123";
  let thrown: unknown;

  try {
    readConfig({
      DATABASE_URL: `postgresql://finpulse:${placeholderSecret}@127.0.0.1:notaport/finpulse_dev`,
    });
  } catch (error) {
    thrown = error;
  }

  expect(thrown).toBeInstanceOf(Error);
  expect(String(thrown)).toMatch(/DATABASE_URL/);
  expect(inspect(thrown)).not.toContain(placeholderSecret);
});
