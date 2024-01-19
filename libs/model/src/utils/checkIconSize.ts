import { z } from 'zod';
import { MAX_COMMUNITY_IMAGE_SIZE_KB } from './constants';
import { getFileSizeBytes } from './getFileSizeBytes';

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
