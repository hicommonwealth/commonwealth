function isInScientificNotation(value: number) {
  return value.toString().toLowerCase().includes('e');
}

function getExponent(value: number) {
  // return the exponent part from a scientific notation value ex: return 7 from 8e-7
  const scientificNotation = value.toExponential();
  const parts = scientificNotation.split('e-');
  return parseInt(parts[1]);
}

export function formatFractionalValue(value: number) {
  const displayZerosAfterDecimal = 2;

  // if the number is in scientific notation, calculate fractional subscript value
  if (isInScientificNotation(value)) {
    const exponent = Math.abs(getExponent(value));
    const valueBeforeExponent = value.toString().split('e-')[0];
    return {
      valueAfterDecimal0s: parseInt(valueBeforeExponent),
      decimal0Count: exponent,
    };
  }

  // if the number is a decimal less than 1, calculate fractional subscript value
  if (value.toString().includes('.') && value < 1) {
    const valueWith7Decimals = parseFloat(value.toFixed(7));

    const decimalPart = valueWith7Decimals.toString()?.split('.')?.[1];

    // find concurrent non-0 digits after decimal
    const decimal0Count = decimalPart.search(/[^0]/);

    // if there are no decimal 0's after the decimal point then display number
    // with 2 decimal places ex: 0.111111 would become 0.11
    if (decimal0Count === 0) {
      return value.toFixed(2);
    }

    // display the original value if these decimal 0 count values are allowed
    // ex: 0.00111 would become 0.001
    if (displayZerosAfterDecimal === decimal0Count) {
      return valueWith7Decimals.toFixed(3);
    }

    // get the digits after the leading zeros (get max 3 digits)
    const valueAfterDecimal0s = decimalPart.slice(
      decimal0Count,
      decimal0Count + 4,
    );

    return {
      valueAfterDecimal0s: parseInt(valueAfterDecimal0s), // avoid leading zeros by converting to int
      decimal0Count: decimal0Count,
    };
  }

  // get 2 decimal places for values >= 1
  return value.toFixed(2);
}
