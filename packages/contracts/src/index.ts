import { z } from "zod";

export const healthResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("ok"), database: z.literal("up") }),
  z.object({ status: z.literal("unavailable"), database: z.literal("down") }),
]);

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const healthStatusCodes = {
  ok: 200,
  unavailable: 503,
} as const satisfies Record<HealthResponse["status"], number>;
