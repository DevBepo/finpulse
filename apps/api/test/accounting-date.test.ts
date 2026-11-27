import { expect, it } from "vitest";
import { readConfig } from "../src/config.js";
import { toAccountingDate } from "../src/domain/accounting-date.js";

it("keeps a 22:30 São Paulo purchase in January when February has started in UTC", () => {
  const occurredAt = new Date("2026-02-01T01:30:00Z");

  expect(toAccountingDate(occurredAt)).toBe("2026-01-31");
});

it("uses the configured timezone to determine the calendar date", () => {
  const occurredAt = new Date("2026-02-01T01:30:00Z");
  const { timeZone } = readConfig({
    APP_TIMEZONE: "UTC",
    DATABASE_URL: "postgresql://finpulse@127.0.0.1/finpulse_dev",
  });

  expect(toAccountingDate(occurredAt, timeZone)).toBe("2026-02-01");
});

it("returns a four-digit Gregorian calendar year", () => {
  const occurredAt = new Date("0001-01-02T00:00:00Z");

  expect(toAccountingDate(occurredAt, "UTC")).toBe("0001-01-02");
});

it("preserves year zero in the ISO calendar date", () => {
  const occurredAt = new Date("0000-01-02T00:00:00Z");

  expect(toAccountingDate(occurredAt, "UTC")).toBe("0000-01-02");
});

it.each(["-000001-01-02T00:00:00Z", "+010000-01-02T00:00:00Z"])(
  "rejects %s because its local year cannot fit in YYYY-MM-DD",
  (timestamp) => {
    expect(() => toAccountingDate(new Date(timestamp), "UTC")).toThrow(
      RangeError,
    );
  },
);
