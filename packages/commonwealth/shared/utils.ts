import { Dec, IntPretty } from '@keplr-wallet/unit';
import { isHex, isU8a } from '@polkadot/util';
import {
  checkAddress,
  decodeAddress,
  encodeAddress,
} from '@polkadot/util-crypto';

export const slugifyPreserveDashes = (str: string): string => {
  // Remove any character that isn't a alphanumeric character, a
  // space, or a dash, and then replace any sequence of spaces with a single dash.

  // return str
  //   .toLowerCase()
  //   .trim()
  //   .replace(/[^A-Za-z0-9]+/g, '-');

  return str
    .replace(/[^A-Za-z0-9 -]/g, '')
    .replace(/(\s|-)+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
};

// WARN: Using process.env to avoid webpack failures
export const getCommunityUrl = (community: string): string => {
  return process.env.NODE_ENV === 'production'
    ? `https://commonwealth.im/${community}`
    : `http://localhost:8080/${community}`;
};

export const smartTrim = (
  text: string | undefined,
  maxLength = 200,
): string => {
  if (!text) return '';
  if (text.length > maxLength) {
    const smartTrimmedText = text.slice(0, maxLength).replace(/\W+$/, '');
    if (smartTrimmedText.length === 0) return `${text.slice(0, maxLength)}...`;
    return `${smartTrimmedText}...`;
  } else {
    return text;
  }
};

export const validURL = (str) => {
  const pattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+:@]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$',
    'i',
  ); // fragment locator
  return !!pattern.test(str);
};

export const urlHasValidHTTPPrefix = (url: string) => {
  return url.indexOf('http://') === 0 || url.indexOf('https://') === 0;
};

export function formatAddressShort(
  address: string,
  chain?: string,
  includeEllipsis?: boolean,
  maxCharLength?: number,
  prefix?: string,
) {
  if (!address) return;
  if (chain === 'near') {
    return `@${address}`;
  } else if (prefix && !maxCharLength) {
    if (!includeEllipsis) return address;
    const totalLength = address.length;
    return `${address.slice(0, prefix.length + 3)}...${address.slice(
      totalLength - 4,
      totalLength,
    )}`;
  } else {
    return `${address.slice(0, maxCharLength || 5)}${
      includeEllipsis ? '…' : ''
    }`;
  }
}

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
  const [valid] = checkAddress(options.address, options.currentPrefix);

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
