const supportedCurrencies = new Set(Intl.supportedValuesOf("currency"));

export class Money {
  public readonly minorUnits: number;
  public readonly currency: string;

  constructor(minorUnits: number, currency = "BRL") {
    if (!Number.isSafeInteger(minorUnits) || minorUnits < 0) {
      throw new RangeError(
        "Money requires a non-negative safe integer amount in minor units",
      );
    }

    if (!supportedCurrencies.has(currency)) {
      throw new RangeError("Money requires a supported ISO currency code");
    }

    this.minorUnits = minorUnits === 0 ? 0 : minorUnits;
    this.currency = currency;
    Object.freeze(this);
  }
}
