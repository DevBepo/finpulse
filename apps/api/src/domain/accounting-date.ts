export const DEFAULT_APP_TIMEZONE = "America/Sao_Paulo";

export type AccountingDate = string & { readonly __brand: "AccountingDate" };

const MAX_CACHED_FORMATTERS = 32;
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(timeZone);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat("en", {
    calendar: "gregory",
    numberingSystem: "latn",
    timeZone,
    era: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  if (formatterCache.size >= MAX_CACHED_FORMATTERS) {
    const oldestKey = formatterCache.keys().next().value;
    if (oldestKey !== undefined) {
      formatterCache.delete(oldestKey);
    }
  }
  formatterCache.set(timeZone, formatter);

  return formatter;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    getDateFormatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

export function toAccountingDate(
  occurredAt: Date,
  timeZone = DEFAULT_APP_TIMEZONE,
): AccountingDate {
  const formatter = getDateFormatter(timeZone);
  const { era, year, month, day } = Object.fromEntries<string>(
    formatter.formatToParts(occurredAt).map(({ type, value }) => [type, value]),
  );

  if (!era || !year || !month || !day) {
    throw new Error("Could not determine the Accounting Date");
  }

  const isoYear = era === "BC" ? 1 - Number(year) : Number(year);
  if (isoYear < 0 || isoYear > 9999) {
    throw new RangeError("Accounting Date requires a four-digit year");
  }

  return `${String(isoYear).padStart(4, "0")}-${month}-${day}` as AccountingDate;
}
