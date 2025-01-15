import { fromBech32, toHex } from '@cosmjs/encoding';
import { isHex, isU8a } from '@polkadot/util';
import {
  checkAddress,
  decodeAddress,
  encodeAddress,
} from '@polkadot/util-crypto';
import moment from 'moment';
import {
  CONTEST_FEE_PERCENT,
  PRODUCTION_DOMAIN,
  S3_ASSET_BUCKET_CDN,
  S3_RAW_ASSET_BUCKET_DOMAIN,
} from './constants';

/**
 * Decamelizes a string
 * @param value camelized string
 * @returns decamelized string
 */
export const decamelize = (value: string): string =>
  value
    .replace(/([\p{Lowercase_Letter}\d])(\p{Uppercase_Letter})/gu, '$1_$2')
    .replace(
      /(\p{Uppercase_Letter}+)(\p{Uppercase_Letter}\p{Lowercase_Letter}+)/gu,
      '$1_$2',
    )
    .toLowerCase();

export const slugify = (str: string): string => {
  // Remove any character that isn't a alphanumeric character or a
  // space, and then replace any sequence of spaces with dashes.
  if (!str) return '';

  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};
/* eslint-disable */

export const splitAndDecodeURL = (locationPathname: string) => {
  //checks if a url is custom or not and decodes the url after splitting it
  //this is to check for malformed urls on a topics page in /discussions
  const splitURLPath = locationPathname.split('/');
  if (splitURLPath[2] === 'discussions') {
    return splitURLPath[3] ? decodeURIComponent(splitURLPath[3]) : null;
  }
  splitURLPath[1] === 'discussions';
  return splitURLPath[2] ? decodeURIComponent(splitURLPath[2]) : null;
};

export const getThreadUrl = (
  thread: {
    chain: string;
    type_id?: string | number;
    id?: string | number;
    title?: string;
  },
  comment?: string | number,
  relative?: boolean,
): string => {
  const aId = thread.chain;
  const tId = thread.type_id || thread.id;
  const tTitle = thread.title ? `-${slugify(thread.title)}` : '';
  const cId = comment ? `?comment=${comment}` : '';

  const relativePath = `/${aId}/discussion/${tId}${tTitle.toLowerCase()}${cId}`;

  if (relative) {
    return relativePath;
  }

  // TODO: Should we relocate this?
  // - cannot use config util in libs/shared
  // - duplicate found in knock utils
  return process.env.NODE_ENV === 'production'
    ? `https://${PRODUCTION_DOMAIN}${relativePath}`
    : `http://localhost:8080${relativePath}`;
};

export function timeoutPromise(timeout: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error(`Timed out after ${timeout}ms`));
    }, timeout);
  });
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Converts an S3 file URL from the raw bucket URL to the Cloudflare CDN format.
 * This is most often used in combination with pre-signed S3 upload URLs.
 * Ex Input: https://s3.us-east-1.amazonaws.com/${S3_ASSET_BUCKET_CDN}/f2e44ed9-2fb4-4746-8d7a-4a60fcd83b77.png
 * Ex Output: https://${S3_ASSET_BUCKET_CDN}/f2e44ed9-2fb4-4746-8d7a-4a60fcd83b77.png
 */
export function formatBucketUrlToAssetCDN(uploadLocation: string) {
  if (
    process.env.APP_ENV &&
    ['production', 'beta'].includes(process.env.APP_ENV)
  ) {
    const fileName = uploadLocation.split('/').pop() || '';
    return `https://${S3_ASSET_BUCKET_CDN}/${fileName}`;
  }
  return uploadLocation;
}

/**
 * Converts an S3 file URL from the CDN format to the raw assets bucket URL.
 * This function should only be used server side when the raw S3 headers are
 * required in the response (CloudFlare truncates headers).
 * Ex Input: https://${S3_ASSET_BUCKET_CDN}/f2e44ed9-2fb4-4746-8d7a-4a60fcd83b77.png
 * Ex Output: https://s3.us-east-1.amazonaws.com/${S3_ASSET_BUCKET_CDN}/f2e44ed9-2fb4-4746-8d7a-4a60fcd83b77.png
 */
export function formatAssetUrlToS3(uploadLocation: string): string {
  if (uploadLocation.includes(S3_RAW_ASSET_BUCKET_DOMAIN)) {
    return uploadLocation;
  }
  return uploadLocation.replace(
    S3_ASSET_BUCKET_CDN,
    S3_RAW_ASSET_BUCKET_DOMAIN,
  );
}

export async function getFileSizeBytes(url: string): Promise<number> {
  try {
    const s3Url = formatAssetUrlToS3(url);
    if (!s3Url) return 0;
    // Range header is to prevent it from reading any bytes from the GET request because we only want the headers.
    const response = await fetch(s3Url, { headers: { Range: 'bytes=0-0' } });
    if (!response) return 0;
    const contentRange = response.headers.get('content-range');
    return contentRange ? parseInt(contentRange.split('/')[1], 10) : 0;
  } catch (err) {
    return 0;
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

function getWordAtIndex(
  inputString: string,
  index: number,
): {
  word: string;
  startIndex: number;
  endIndex: number;
} | null {
  if (index < 0 || index >= inputString.length || inputString[index] === ' ') {
    return null;
  }

  // Find the start of the word
  let start = index;
  while (start > 0 && inputString[start - 1] !== ' ') {
    start--;
  }

  // Find the end of the word
  let end = index;
  while (end < inputString.length && inputString[end] !== ' ') {
    end++;
  }

  // Extract and return the word
  return {
    word: inputString.substring(start, end),
    startIndex: start,
    endIndex: end,
  };
}

/**
 * This function attempts to safely truncates thread or comment content by not splicing urls
 * or user mentions e.g. `[@Tim](/profile/id/118532)`. If the body contains only a URL or a user mention,
 * and it does not fit in the provided length, the function will return '...'
 * @param body A thread or comment body.
 * @param length The maximum length of the returned string. Note, the returned string may be shorter than this length.
 */
export function safeTruncateBody(body: string, length: number = 500): string {
  if (body.length <= length) return body;

  // Regular expressions to identify URLs and user mentions
  const urlRegex = /((https?:\/\/|www\.)[^\s]+)$/gi;
  const mentionRegex = /\[@[^\]]+\]\(\/profile\/id\/\d+\)$/g;

  const result = getWordAtIndex(body, length);
  if (!result) return body.substring(0, length);

  const match = urlRegex.exec(result.word) || mentionRegex.exec(result.word);
  if (!match) return body.substring(0, length);
  else if (match && result.startIndex === 0 && result.endIndex > length) {
    return '...';
  } else {
    return body.substring(0, result.startIndex);
  }
}

export const preprocessQuillDeltaForRendering = (nodes: any[]) => {
  // split up nodes at line boundaries
  const lines = [];
  for (const node of nodes) {
    if (typeof node.insert === 'string') {
      const matches = node.insert.match(/[^\n]+\n?|\n/g);
      (matches || []).forEach((line: string) => {
        lines.push({ attributes: node.attributes, insert: line });
      });
    } else {
      lines.push(node);
    }
  }
  // group nodes under parents
  const result = [];
  let parent = { children: [] as any[], attributes: undefined };
  for (const node of lines) {
    if (typeof node.insert === 'string' && node.insert.endsWith('\n')) {
      parent.attributes = node.attributes;
      // concatenate code-block node parents together, keeping newlines
      if (
        result.length > 0 &&
        result[result.length - 1].attributes &&
        parent.attributes &&
        parent.attributes['code-block'] &&
        result[result.length - 1]!.attributes!['code-block']
      ) {
        parent.children.push({ insert: node.insert });
        result[result.length - 1].children = result[
          result.length - 1
        ].children.concat(parent.children);
      } else {
        parent.children.push({ insert: node.insert });
        result.push(parent);
      }
      parent = { children: [], attributes: undefined };
    } else {
      parent.children.push(node);
    }
  }
  // If there was no \n at the end of the document, we need to push whatever remains in `parent`
  // onto the result. This may happen if we are rendering a truncated Quill document
  if (parent.children.length > 0) {
    result.push(parent);
  }

  // trim empty newlines at end of document
  while (
    result.length &&
    result[result.length - 1].children.length === 1 &&
    typeof result[result.length - 1].children[0].insert === 'string' &&
    result[result.length - 1].children[0].insert === '\n' &&
    result[result.length - 1].children[0].attributes === undefined
  ) {
    result.pop();
  }

  return result;
};

// sanitizeQuillText returns a sanitized version of the input
export type QuillOps = {
  ops: any[];
};

export const renderQuillDeltaToText = (
  delta: QuillOps,
  paragraphSeparator = '\n\n',
) => {
  return preprocessQuillDeltaForRendering(delta.ops)
    .map((parent) => {
      return parent.children
        .map((child) => {
          if (typeof child.insert === 'string')
            return child.insert.trimRight('\n');
          if (child.insert?.image) return '(image)';
          if (child.insert?.twitter) return '(tweet)';
          if (child.insert?.video) return '(video)';
          return '';
        })
        .filter((child) => !!child)
        .join(' ')
        .replace(/  +/g, ' '); // remove multiple spaces
    })
    .filter((parent) => !!parent)
    .join(paragraphSeparator);
};

export function getDecodedString(str: string) {
  try {
    return decodeURIComponent(str);
  } catch (err) {
    return str;
  }
}

/**
 * Convert Cosmos bech32 address to a hexadecimal string
 * hex is used as a common identifier for addresses across chains.
 * This allows us to achieve One Signer, One Account
 *
 * Example:
 * bech32ToHex('osmo18q3tlnx8vguv2fadqslm7x59ejauvsmnhltgq6') => '3822bfccc76238c527ad043fbf1a85ccbbc64373'
 * bech32ToHex('cosmos18q3tlnx8vguv2fadqslm7x59ejauvsmnlycckg') => '3822bfccc76238c527ad043fbf1a85ccbbc64373' (same)
 *
 * Caveat: Ethermint addresses will share a hex, but it will differ from
 * their siblings on standard Cosmos derivation paths.
 * e.g. evmos hex != osmo hex, but evmos hex == inj hex
 */
export function bech32ToHex(address: string) {
  try {
    const encodedData = fromBech32(address).data;
    return toHex(encodedData);
  } catch (e) {
    console.log(`Error converting bech32 to hex: ${e}. Hex was not generated.`);
  }
}

export function buildFarcasterContestFrameUrl(contestAddress: string) {
  return `/api/integration/farcaster/contests/${contestAddress}/contestCard`;
}

// Date utils
export function isWithinPeriod(
  refDate: Date,
  targetDate: Date,
  period: moment.unitOfTime.Base,
): boolean {
  const start = moment(refDate).startOf(period);
  const end = moment(refDate).endOf(period);
  return moment(targetDate).isBetween(start, end, null, '[]');
}

export async function alchemyGetTokenPrices({
  alchemyApiKey,
  tokenSources,
}: {
  alchemyApiKey: string;
  tokenSources: {
    contractAddress: string;
    alchemyNetworkId: string;
  }[];
}): Promise<{
  data: {
    network: string;
    address: string;
    prices: { currency: string; value: string; lastUpdatedAt: string }[];
    error: string | null;
  }[];
}> {
  const options = {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      addresses: tokenSources.map((x) => ({
        network: x.alchemyNetworkId,
        address: x.contractAddress,
      })),
    }),
  };

  const res = await fetch(
    `https://api.g.alchemy.com/prices/v1/${alchemyApiKey}/tokens/by-address`,
    options,
  );

  if (res.ok) return res.json();
  else
    throw new Error('Failed to fetch token prices', {
      cause: { status: res.status, statusText: res.statusText },
    });
}

export const getBaseUrl = (
  env: 'local' | 'CI' | 'frick' | 'frack' | 'beta' | 'demo' | 'production',
) => {
  switch (env) {
    case 'local':
    case 'CI':
      return 'http://localhost:8080';
    case 'beta':
      return 'https://qa.commonwealth.im';
    case 'demo':
      return 'https://demo.commonwealth.im';
    case 'frick':
      return 'https://frick.commonwealth.im';
    case 'frack':
      return 'https://frack.commonwealth.im';
    default:
      return `https://${PRODUCTION_DOMAIN}`;
  }
};

export const buildContestLeaderboardUrl = (
  baseUrl: string,
  communityId: string,
  contestAddress: string,
) => {
  return `${baseUrl}/${communityId}/contests/${contestAddress}`;
};

// returns balance with fee deducted
export const calculateNetContestBalance = (originalBalance: number) => {
  const multiplier = (100 - CONTEST_FEE_PERCENT) / 100;
  return (originalBalance || 0) * multiplier;
};

// returns array of prize amounts
export const buildContestPrizes = (
  contestBalance: number,
  payoutStructure?: number[],
  decimals?: number,
): number[] => {
  // 10% fee deducted from prize pool
  const netContestBalance = calculateNetContestBalance(Number(contestBalance));
  return netContestBalance && payoutStructure
    ? payoutStructure.map(
        (percentage) =>
          (Number(netContestBalance) * (percentage / 100)) /
          Math.pow(10, decimals || 18),
      )
    : [];
};
