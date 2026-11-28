import { z } from "zod";
import {
  DEFAULT_APP_TIMEZONE,
  isValidTimeZone,
} from "./domain/accounting-date.js";

const databaseNamePattern = /^\/[^/\s]+$/;

const envSchema = z.object({
  DATABASE_URL: z
    .url({ protocol: /^postgres(?:ql)?$/, hostname: /.+/ })
    .refine((url) => {
      const parsed = URL.parse(url);
      return parsed === null || databaseNamePattern.test(parsed.pathname);
    }, "Expected a database name in DATABASE_URL"),
  APP_TIMEZONE: z
    .string()
    .refine(isValidTimeZone, "Expected a valid timezone")
    .default(DEFAULT_APP_TIMEZONE),
  API_PORT: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(65_535))
    .default(3000),
});

export function readConfig(env: NodeJS.ProcessEnv) {
  const parsed = envSchema.parse(env);
  return {
    databaseUrl: parsed.DATABASE_URL,
    timeZone: parsed.APP_TIMEZONE,
    port: parsed.API_PORT,
  };
}
