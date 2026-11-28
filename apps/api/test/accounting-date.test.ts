import { expect, it } from "vitest";
import { toAccountingDate } from "../src/domain/accounting-date.js";

it("keeps a 22:30 São Paulo purchase in January when February has started in UTC", () => {
  const occurredAt = new Date("2026-02-01T01:30:00Z");

  expect(toAccountingDate(occurredAt)).toBe("2026-01-31");
});

it("keeps a 22:30 São Paulo purchase on December 31 in the prior year", () => {
  const occurredAt = new Date("2026-01-01T01:30:00Z");

  expect(toAccountingDate(occurredAt)).toBe("2025-12-31");
});

it("keeps a 22:30 São Paulo purchase on leap day in February", () => {
  const occurredAt = new Date("2024-03-01T01:30:00Z");

  expect(toAccountingDate(occurredAt)).toBe("2024-02-29");
});

it("flips the Accounting Date at exact São Paulo midnight", () => {
  expect(toAccountingDate(new Date("2026-02-01T02:59:59.999Z"))).toBe(
    "2026-01-31",
  );
  expect(toAccountingDate(new Date("2026-02-01T03:00:00.000Z"))).toBe(
    "2026-02-01",
  );
});

it("applies historical Brazilian daylight-saving rules via IANA timezone data", () => {
  const occurredAt = new Date("2018-12-01T02:30:00Z");

  expect(toAccountingDate(occurredAt)).toBe("2018-12-01");
});

it("uses the specified timezone to determine the calendar date", () => {
  const occurredAt = new Date("2026-02-01T01:30:00Z");

  expect(toAccountingDate(occurredAt, "UTC")).toBe("2026-02-01");
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

it("rejects invalid dates and unknown timezones", () => {
  expect(() => toAccountingDate(new Date("invalid"))).toThrow(RangeError);
  expect(() =>
    toAccountingDate(new Date("2026-02-01T01:30:00Z"), "Brazil/Imaginary"),
  ).toThrow(RangeError);
});
