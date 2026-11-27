import { expect, it } from "vitest";
import { Money } from "../src/domain/money.js";

it("keeps an exact amount in minor units with BRL as the default currency", () => {
  expect(new Money(12_345)).toEqual({
    minorUnits: 12_345,
    currency: "BRL",
  });
});

it.each([1.25, Number.NaN, -1, Infinity, Number.MAX_SAFE_INTEGER + 1])(
  "rejects %s as an inexact or negative amount",
  (minorUnits) => {
    expect(() => new Money(minorUnits)).toThrow(RangeError);
  },
);

it("rejects an unassigned ISO currency code", () => {
  expect(() => new Money(12_345, "ZZZ")).toThrow(RangeError);
});
