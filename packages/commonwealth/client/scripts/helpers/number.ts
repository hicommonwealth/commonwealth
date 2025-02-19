// Ex: oldValue = 100, newValue = 99, result = 0.01
export const calculateRemainingPercentageChangeFractional = (
  oldValue: number,
  newValue: number,
) => {
  return 1 - Math.abs((newValue - oldValue) / oldValue);
};
