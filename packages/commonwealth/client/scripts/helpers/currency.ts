export enum SupportedCurrencies {
  USD = 'USD',
}

export enum CurrenciesSymbols {
  USD = '$',
}

export const currencyNameToSymbolMap: Record<
  SupportedCurrencies,
  CurrenciesSymbols
> = {
  [SupportedCurrencies.USD]: CurrenciesSymbols.USD,
  // add more when supported
};

export const currencySymbolPlacements = {
  onLeft: [SupportedCurrencies.USD],
  onRight: [] as string[], // some currencies use right side placements
};

export const getAmountWithCurrencySymbol = (
  amount: number,
  currencyName: SupportedCurrencies,
) => {
  const symbol = currencyNameToSymbolMap[currencyName];
  const leftSymbol = currencySymbolPlacements.onLeft.includes(currencyName)
    ? symbol
    : '';
  const rightymbol = currencySymbolPlacements.onRight.includes(currencyName)
    ? symbol
    : '';

  return `${leftSymbol} ${amount} ${rightymbol}`;
};
