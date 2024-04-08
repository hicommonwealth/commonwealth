import { z } from 'zod';

export const ALL_COMMUNITIES = 'all_communities';
export const MAX_COMMUNITY_IMAGE_SIZE_KB = 500;

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

export function buildThreadUrl(communityId: string, threadId: number): string {
  return `/${communityId}/discussion/${threadId}`;
}
