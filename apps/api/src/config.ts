import { z } from "zod";
import { DEFAULT_APP_TIMEZONE } from "./domain/accounting-date.js";

const envSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(?:ql)?$/, hostname: /.+/ }),
  APP_TIMEZONE: z
    .string()
    .refine((timeZone) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone });
        return true;
      } catch {
        return false;
      }
    }, "Expected a valid timezone")
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
