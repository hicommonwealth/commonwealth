// Ex: oldValue = 100, newValue = 99, result = 0.01
export const calculateRemainingPercentageChangeFractional = (
  oldValue: number,
  newValue: number,
) => {
  return 1 - Math.abs((newValue - oldValue) / oldValue);
};

// Ex:
// inputs: number = 9, roundTo = 2, returns 9
// inputs: number = 9.1234567, roundTo = 2, returns 9.12
export const roundDecimalsOrReturnWhole = (number: number, roundTo: number) => {
  if (number % 1 === 0) return number; // return integer number as is

  // if decimal part less than the precision we're rounding to, round number to an integer
  if (Math.abs(number % 1) < Math.pow(10, -roundTo)) {
    return Math.round(number);
  }

  // round decimal number to 2 decimal places
  return parseFloat(number.toFixed(roundTo));
};
