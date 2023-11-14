import { Dec, IntPretty } from '@keplr-wallet/unit';
import { isHex, isU8a } from '@polkadot/util';
import {
  checkAddress,
  decodeAddress,
  encodeAddress,
} from '@polkadot/util-crypto';

// crypto imports take forever. This is fine for starting server, but becomes a real pain when running tests
export const addressSwapper = (options: {
  address: string;
  currentPrefix: number;
}): string => {
  if (!options.address) throw new Error('No address provided to swap');

  if (!options.currentPrefix) return options.address;

  if (isU8a(options.address) || isHex(options.address)) {
    throw new Error('address not in SS58 format');
  }

  // check if it is valid as an address
  let decodedAddress: Uint8Array;

  try {
    decodedAddress = decodeAddress(options.address);
  } catch (e) {
    throw new Error('failed to decode address');
  }

  // check if it is valid with the current prefix & reencode if needed
  const [valid, errorMsg] = checkAddress(
    options.address,
    options.currentPrefix,
  );

  if (!valid) {
    try {
      return encodeAddress(decodedAddress, options.currentPrefix);
    } catch (e) {
      throw new Error('failed to reencode address');
    }
  } else {
    return options.address;
  }
};

/**
 * Convert Cosmos-style minimal denom amount to readable full-denom amount
 * Example 7000000 uosmo -> 7 OSMO
 * Example 8000000000000000000 aevmos -> 8 EVMOS
 */
export function minimalToNaturalDenom(
  amount?: string | number,
  decimals?: number,
): string {
  if (!amount || !decimals) return '0';
  const intPretty = new IntPretty(
    new Dec(amount.toString()),
  ).moveDecimalPointLeft(decimals);

  // return full decimal precision and let the UI handle rounding
  return intPretty.toDec().toString(decimals);
}

/**
 * Convert readable full-denom amount to minimal denom amount (BigInt)
 * Example 8 OSMO -> 8000000 uosmo
 * Example 8 EVMOS -> 8000000000000000000 aevmos
 * Intended for Cosmos use (decimals usually 6 or 18)
 */
export function naturalDenomToMinimal(
  naturalAmount?: string | number,
  decimals?: number,
): string {
  if (!naturalAmount || !decimals) return '0';
  const intPretty = new IntPretty(
    new Dec(naturalAmount.toString()),
  ).moveDecimalPointRight(decimals);

  // 0 decimal places because this is max precision for the chain
  return intPretty.toDec().toString(0);
}
