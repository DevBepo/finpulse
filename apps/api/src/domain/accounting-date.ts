export const DEFAULT_APP_TIMEZONE = "America/Sao_Paulo";

export function toAccountingDate(
  occurredAt: Date,
  timeZone = DEFAULT_APP_TIMEZONE,
): string {
  const formatter = new Intl.DateTimeFormat("en", {
    calendar: "gregory",
    numberingSystem: "latn",
    timeZone,
    era: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
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

  return `${String(isoYear).padStart(4, "0")}-${month}-${day}`;
}
