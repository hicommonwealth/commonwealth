// Library for bitwise operations on numbers.

export function setBit(n: bigint, k: number): bigint {
  return n | (BigInt(1) << (BigInt(k) - BigInt(1)));
}

export function clearBit(n: bigint, k: number): bigint {
  return n & ~(BigInt(1) << (BigInt(k) - BigInt(1)));
}

// Function to toggle the kth bit of n
export function toggleBit(n: bigint, k: number): bigint {
  return n ^ (BigInt(1) << (BigInt(k) - BigInt(1)));
}
