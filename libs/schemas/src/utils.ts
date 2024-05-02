import { MAX_COMMUNITY_IMAGE_SIZE_KB } from '@hicommonwealth/shared';
import { z } from 'zod';

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
