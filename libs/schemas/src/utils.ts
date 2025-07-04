import {
  MAX_COMMUNITY_IMAGE_SIZE_KB,
  MAX_SCHEMA_ETH,
  MAX_SCHEMA_INT,
  MIN_SCHEMA_ETH,
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

export const DiscordMetaSchema = z.object({
  user: z.object({
    id: z.string(),
    username: z.string(),
  }),
  channel_id: z.string(),
  message_id: z.string(),
});

export const PG_INT = z.number().int().min(MIN_SCHEMA_INT).max(MAX_SCHEMA_INT);

export const PG_ETH = z.coerce.bigint().min(MIN_SCHEMA_ETH).max(MAX_SCHEMA_ETH);

export const zBoolean = z.preprocess((v) => v && v !== 'false', z.boolean());

export const EVM_ADDRESS_STRICT_REGEX = /^0x[0-9a-fA-F]{40}$/;

export const EVM_EVENT_SIGNATURE_STRICT_REGEX = /^0x[0-9a-fA-F]{64}$/;

export const EVM_ADDRESS = z.string().regex(EVM_ADDRESS_STRICT_REGEX);

// Primarily used by Viem since they return strict `0x${string}` types instead of `string`
export const EVM_ADDRESS_STRICT = z.custom<`0x${string}`>((val) =>
  EVM_ADDRESS_STRICT_REGEX.test(val as string),
);
export const EVM_EVENT_SIGNATURE_STRICT = z.custom<`0x${string}`>((val) =>
  EVM_EVENT_SIGNATURE_STRICT_REGEX.test(val as string),
);
export const EVM_BYTES = z.custom<`0x${string}`>((val) =>
  /^0x[0-9a-fA-F]*$/.test(val as string),
);

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

export const Environments = [
  'development',
  'test',
  'staging',
  'production',
] as const;
