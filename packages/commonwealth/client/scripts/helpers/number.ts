// Ex: oldValue = 100, newValue = 99, result = 0.01
export const calculatePercentageChangeFractional = (
  oldValue: number,
  newValue: number,
) => {
  return Math.abs((newValue - oldValue) / oldValue);
};
