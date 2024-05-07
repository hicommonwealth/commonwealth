import {
  LinkSource,
  MAX_COMMUNITY_IMAGE_SIZE_KB,
  MAX_SCHEMA_INT,
  MIN_SCHEMA_INT,
  getFileSizeBytes,
} from '@hicommonwealth/shared';
import { z } from 'zod';

export const paginationSchema = {
  limit: z.coerce
    .number()
    .int()
    .default(20)
    .describe('The number of objects returned'),
  offset: z.coerce
    .number()
    .int()
    .default(0)
    .describe('The amount of objects offset from the beginning'),
  page: z.coerce.number().int().default(1).describe('The page returned'),
};

export const discordMetaSchema = {
  user: z.object({
    id: z.string(),
    username: z.string(),
  }),
  channel_id: z.string(),
  message_id: z.string(),
};

export const linksSchema = {
  source: z.nativeEnum(LinkSource),
  identifier: z.string(),
  title: z.string().nullable().optional(),
};

export const PG_INT = z.number().int().min(MIN_SCHEMA_INT).max(MAX_SCHEMA_INT);
export const zBoolean = z.preprocess((v) => v && v !== 'false', z.boolean());

export const ETHERS_BIG_NUMBER = z.object({
  hex: z.string().regex(/^0x[0-9a-fA-F]+$/),
  type: z.literal('BigNumber'),
});

export const EVM_ADDRESS = z.string().regex(/^0x[0-9a-fA-F]{40}$/);

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

export type ErrorMapperFn = (err: Error) => Error | null;

export async function withErrorMappers<T>(
  errorMapperFns: ErrorMapperFn[],
  fn: () => Promise<T>,
): Promise<T> {
  let result: T | undefined = undefined;
  try {
    result = await fn();
  } catch (err) {
    for (const mapper of errorMapperFns) {
      const mappedError = mapper(err as Error);
      if (mappedError) {
        throw mappedError;
      }
    }
    throw err;
  }
  return result;
}
