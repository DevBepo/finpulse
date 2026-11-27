const supportedCurrencies = new Set(Intl.supportedValuesOf("currency"));

export class Money {
  constructor(
    public readonly minorUnits: number,
    public readonly currency = "BRL",
  ) {
    if (!Number.isSafeInteger(minorUnits) || minorUnits < 0) {
      throw new RangeError(
        "Money requires a non-negative safe integer amount in minor units",
      );
    }

    if (!supportedCurrencies.has(currency)) {
      throw new RangeError("Money requires a supported ISO currency code");
    }
  }
}
