import { isHex, isU8a } from '@polkadot/util';
import {
  checkAddress,
  decodeAddress,
  encodeAddress,
} from '@polkadot/util-crypto';

export function foo() {}

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

  if (typeof document !== 'undefined') {
    if (['localhost', '127.0.0.1'].includes(document.location.hostname)) {
      return `${document.location.origin}${relativePath}`;
    }
  }

  return `https://commonwealth.im${relativePath}`;
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

export function formatAssetUrlToS3(uploadLocation: string): string {
  const S3Domain = 's3.us-east-1.amazonaws.com/assets.commonwealth.im';
  if (uploadLocation.includes(S3Domain)) {
    return uploadLocation;
  }
  return uploadLocation.replace('assets.commonwealth.im', S3Domain);
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
