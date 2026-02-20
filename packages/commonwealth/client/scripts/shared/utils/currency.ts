export enum SupportedCryptoCurrencies {
  ETH = 'ETH',
}

export enum SupportedFiatCurrencies {
  USD = 'USD',
}

export enum CurrenciesSymbols {
  USD = '$',
}

export const currencyNameToSymbolMap: Record<
  SupportedFiatCurrencies,
  CurrenciesSymbols
> = {
  [SupportedFiatCurrencies.USD]: CurrenciesSymbols.USD,
  // add more when supported
};

export const currencySymbolPlacements = {
  onLeft: [SupportedFiatCurrencies.USD],
  onRight: [SupportedCryptoCurrencies.ETH], // some currencies use right side placements
};

export const getAmountWithCurrencySymbol = (
  amount: number,
  currencyName: SupportedFiatCurrencies | SupportedCryptoCurrencies,
) => {
  const symbol = currencyNameToSymbolMap[currencyName];
  const leftSymbol = currencySymbolPlacements.onLeft.includes(
    currencyName as SupportedFiatCurrencies,
  )
    ? symbol
    : '';
  const rightymbol = currencySymbolPlacements.onRight.includes(
    currencyName as SupportedCryptoCurrencies,
  )
    ? symbol
    : '';

  return `${leftSymbol} ${amount} ${rightymbol}`;
};
