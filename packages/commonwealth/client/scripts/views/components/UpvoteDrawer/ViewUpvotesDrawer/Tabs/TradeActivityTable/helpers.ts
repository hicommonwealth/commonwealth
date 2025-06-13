import { formatFractionalValue } from '../../../../FractionalValue/helpers';

export const formatValue = (value: number) => {
  const formatted = formatFractionalValue(value);
  if (typeof formatted === 'string' || typeof formatted === 'number') {
    return formatted;
  }
  return `0.${Array.from({ length: formatted.decimal0Count })
    .map((_) => `0`)
    .join('')}${formatted.valueAfterDecimal0s}`;
};
