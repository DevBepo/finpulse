import { expect, it } from "vitest";
import { healthResponseSchema, healthStatusCodes } from "../src/index.js";

it("accepts valid health responses and maps each status to its HTTP code", () => {
  expect(healthResponseSchema.parse({ status: "ok", database: "up" })).toEqual({
    status: "ok",
    database: "up",
  });
  expect(
    healthResponseSchema.parse({ status: "unavailable", database: "down" }),
  ).toEqual({ status: "unavailable", database: "down" });

  expect(healthStatusCodes).toEqual({ ok: 200, unavailable: 503 });
});

it.each([
  { status: "ok", database: "down" },
  { status: "unavailable", database: "up" },
  { status: "degraded", database: "up" },
  {},
])("rejects invalid health payload %j", (payload) => {
  expect(() => healthResponseSchema.parse(payload)).toThrow();
});
