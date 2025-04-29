import { formatFractionalValue as formatSmallFractionalValue } from 'views/components/FractionalValue/helpers';

// Copied from @hicommonwealth/shared/adapters/currency.ts as it wasn't exported correctly
function formatBigNumberShort(num: number, numDecimals: number): string {
  if (num === 0) {
    return '0';
  }
  const thousand = 1_000;
  const million = 1_000_000;
  const billion = 1_000_000_000;
  const trillion = 1_000_000_000_000;

  const round = (n: number, divisor: number): string => {
    const divided = n / divisor;
    // remove unnecessary trailing zeros
    return divided.toFixed(numDecimals).replace(/\.?0+$/, '');
  };

  return num > trillion
    ? `${round(num, trillion)}t`
    : num > billion
      ? `${round(num, billion)}b`
      : num > million
        ? `${round(num, million)}m`
        : num > thousand
          ? `${round(num, thousand)}k`
          : num.toString(); // Keep original number if less than 1000
}

export type FormatNumberOptions = {
  decimals?: number;
  currencySymbol?: string;
  useShortSuffixes?: boolean; // Controls K/M/B/T
  compact?: boolean; // For FractionalValue output
};

export type FractionalValueResult = {
  valueAfterDecimal0s: number;
  decimal0Count: number;
  currencySymbol?: string;
};

/**
 * Formats a number for display, handling large numbers with suffixes (K/M/B/T),
 * comma separation for medium numbers, and small fractional values.
 * Returns either a formatted string or an object for FractionalValue component.
 */
export function formatDisplayNumber(
  value: number | string | undefined | null,
  options: FormatNumberOptions = {},
): string | FractionalValueResult {
  const {
    decimals = 2,
    currencySymbol = '',
    useShortSuffixes = true,
  } = options;

  if (value === null || value === undefined || value === '') {
    return 'N/A'; // Or handle as needed
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return 'N/A'; // Or handle invalid number input
  }

  if (num === 0) {
    return `${currencySymbol}0`;
  }

  // Handle small fractional numbers using existing logic
  if (Math.abs(num) < 1 && Math.abs(num) > 0) {
    const fractionalResult = formatSmallFractionalValue(num);

    // formatSmallFractionalValue returns either a string or an object { decimal0Count, valueAfterDecimal0s }
    if (typeof fractionalResult === 'string') {
      // This handles cases like 0.123 -> "0.12", 0.00123 -> "0.001" based on helper logic
      return `${currencySymbol}${fractionalResult}`;
    }
    if (typeof fractionalResult === 'object' && fractionalResult !== null) {
      // Check the user's desired threshold for using FractionalValue
      if (fractionalResult.decimal0Count >= 4) {
        // Return the object to trigger FractionalValue render for subscript
        return { ...fractionalResult, currencySymbol };
      } else {
        // For decimal0Count 0, 1, 2, 3 (based on helper logic), format as string
        // Use the decimals option passed, or a default like 6 for precision
        const precision = options.decimals === undefined ? 6 : options.decimals;
        return `${currencySymbol}${num.toFixed(precision)}`;
      }
    }
    // Fallback if fractionalResult is null or unexpected type
    return `${currencySymbol}${num.toFixed(6)}`; // Default to 6 decimals
  }

  // Handle numbers >= 1
  let formattedNumber: string;

  if (useShortSuffixes && Math.abs(num) >= 1000) {
    // formatBigNumberShort handles the suffixes, pass required decimals
    formattedNumber = formatBigNumberShort(num, decimals);
  } else {
    // Use Intl.NumberFormat for comma separation and specified decimals
    formattedNumber = num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  // Ensure currency symbol is prepended correctly, handling the case where
  // formatBigNumberShort returns a string without it.
  if (useShortSuffixes && Math.abs(num) >= 1000) {
    // formatBigNumberShort already includes the suffix (k, m, b, t)
    return `${currencySymbol}${formattedNumber}`;
  } else {
    // For numbers less than 1000 or when suffixes are off, formattedNumber is just the number string
    return `${currencySymbol}${formattedNumber}`;
  }
}
