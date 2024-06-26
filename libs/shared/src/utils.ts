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
