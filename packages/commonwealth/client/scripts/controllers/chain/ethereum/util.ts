import { BigNumber } from 'ethers';

export function deserializeBigNumbers(obj: Record<string, any>) {
  // Base case: if the object is not an object or is null, return it as-is
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  // If the object matches the serialized BigNumber pattern, return a deserialized BigNumber
  if (obj.type === 'BigNumber' && obj.hex) {
    return BigNumber.from(obj.hex);
  }

  // If it's an array, iterate over each element and deserialize if needed
  if (Array.isArray(obj)) {
    return obj.map(deserializeBigNumbers);
  }

  // For plain objects, iterate over each property
  const result = {};
  for (const key in obj) {
    result[key] = deserializeBigNumbers(obj[key]);
  }
  return result;
}
