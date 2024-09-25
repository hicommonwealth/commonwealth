import { fromBech32, toHex } from '@cosmjs/encoding';
import { isHex, isU8a } from '@polkadot/util';
import {
  checkAddress,
  decodeAddress,
  encodeAddress,
} from '@polkadot/util-crypto';

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
    return decodeURIComponent(splitURLPath[3]);
  }
  splitURLPath[1] === 'discussions';
  return decodeURIComponent(splitURLPath[2]);
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
    ? `https://commonwealth.im${relativePath}`
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

export function getWebhookDestination(webhookUrl = ''): string {
  if (!/^https?:\/\/[^\s/$.?#].[^\s]*$/.test(webhookUrl)) return 'unknown';

  let destination = 'unknown';
  if (
    webhookUrl.startsWith('https://discord.com/api/webhooks/') ||
    webhookUrl.startsWith('https://discordapp.com/api/webhooks/')
  )
    destination = 'discord';
  else if (webhookUrl.startsWith('https://hooks.slack.com/'))
    destination = 'slack';
  else if (webhookUrl.startsWith('https://hooks.zapier.com/'))
    destination = 'zapier';
  else if (webhookUrl.startsWith('https://api.telegram.org/@')) {
    const [, channelId] = webhookUrl.split('/@');
    if (!channelId) destination = 'unknown';
    else destination = 'telegram';
  }

  return destination;
}

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
export async function bech32ToHex(address: string) {
  try {
    const encodedData = fromBech32(address).data;
    return toHex(encodedData);
  } catch (e) {
    console.log(`Error converting bech32 to hex: ${e}. Hex was not generated.`);
  }
}
