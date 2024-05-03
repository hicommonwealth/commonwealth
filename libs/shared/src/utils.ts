import { z } from 'zod';
import { MAX_COMMUNITY_IMAGE_SIZE_KB } from './constants';

export function foo() {}

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
): string => {
  const aId = thread.chain;
  const tId = thread.type_id || thread.id;
  const tTitle = thread.title ? `-${slugify(thread.title)}` : '';
  const cId = comment ? `?comment=${comment}` : '';

  return process.env.NODE_ENV === 'production'
    ? `https://commonwealth.im/${aId}/discussion/${tId}${tTitle.toLowerCase()}${cId}`
    : `http://localhost:8080/${aId}/discussion/${tId}${tTitle.toLowerCase()}${cId}`;
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

export async function getFileSizeBytes(url: string): Promise<number> {
  try {
    if (!url) return 0;
    // Range header is to prevent it from reading any bytes from the GET request because we only want the headers.
    const response = await fetch(url, { headers: { Range: 'bytes=0-0' } });
    if (!response) return 0;
    const contentRange = response.headers.get('content-range');
    return contentRange ? parseInt(contentRange.split('/')[1], 10) : 0;
  } catch (err) {
    return 0;
  }
}

export async function checkIconSize(val: string, ctx: z.RefinementCtx) {
  const fileSizeBytes = await getFileSizeBytes(val);
  if (fileSizeBytes === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Image url provided doesn't exist",
    });
    return;
  }
  if (fileSizeBytes >= MAX_COMMUNITY_IMAGE_SIZE_KB * 1024) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Image must be smaller than ${MAX_COMMUNITY_IMAGE_SIZE_KB}kb`,
    });
  }
}

export const zBoolean = z.preprocess((v) => v && v !== 'false', z.boolean());
