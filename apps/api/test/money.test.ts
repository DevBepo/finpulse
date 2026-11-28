import { expect, it } from "vitest";
import { Money } from "../src/domain/money.js";

it("keeps an exact amount in minor units with BRL as the default currency", () => {
  expect(new Money(12_345)).toEqual({
    minorUnits: 12_345,
    currency: "BRL",
  });
});

it("accepts zero and normalizes negative zero to canonical zero", () => {
  expect(Object.is(new Money(0).minorUnits, 0)).toBe(true);
  expect(Object.is(new Money(-0).minorUnits, 0)).toBe(true);
});

it("accepts an explicit supported ISO currency code", () => {
  expect(new Money(500, "USD")).toEqual({
    minorUnits: 500,
    currency: "USD",
  });
});

it.each([
  1.25,
  Number.NaN,
  -1,
  Infinity,
  -Infinity,
  Number.MAX_SAFE_INTEGER + 1,
])("rejects %s as an inexact or negative amount", (minorUnits) => {
  expect(() => new Money(minorUnits)).toThrow(RangeError);
});

it.each(["ZZZ", "brl", ""])(
  "rejects %j as an unsupported ISO currency code",
  (currency) => {
    expect(() => new Money(12_345, currency)).toThrow(RangeError);
  },
);
