import {
  ChainBase,
  ChainCategoryType,
  ChainNetwork,
  ChainType,
} from 'common-common/src/types';
import { z } from 'zod';
import { ALL_COMMUNITIES } from '../../server/middleware/databaseValidationService';
import { getFileSizeBytes } from '../../server/util/getFilesSizeBytes';

export const MAX_COMMUNITY_IMAGE_SIZE_KB = 500;

async function checkIconSize(val, ctx) {
  const fileSizeBytes = await getFileSizeBytes(val);
  if (fileSizeBytes === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Image url provided doesn't exist",
    });
  }
  if (fileSizeBytes >= MAX_COMMUNITY_IMAGE_SIZE_KB * 1024) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Image must be smaller than ${MAX_COMMUNITY_IMAGE_SIZE_KB}kb`,
    });
  }
}

export const createCommunitySchema = z.object({
  id: z.string(),
  name: z
    .string()
    .max(255)
    .refine((data) => !data.includes(ALL_COMMUNITIES), {
      message: `String must not contain '${ALL_COMMUNITIES}'`,
    }),
  chain_node_id: z.number().optional(), // corresponds to the chain field
  community_namespace: z
    .object({
      namespace: z.string().optional(),
      tx_receipt: z
        .object({
          transactionHash: z.string(),
          blockNumber: z.number(),
        })
        .optional(), // this comes from NamespaceFactory#deployNamespace
    })
    .refine(
      (data) => !!data.namespace === !!data.tx_receipt,
      'Must contain both namespace and tx_receipt',
    )
    .optional(),
  description: z.string().optional(),
  icon_url: z
    .string()
    .url()
    .superRefine(async (val, ctx) => await checkIconSize(val, ctx))
    .or(z.string().max(0))
    .optional(),
  social_links: z.array(z.string().url()).optional(),
  tags: z.array(z.nativeEnum(ChainCategoryType)).default([]),
  directory_page_enabled: z.boolean().default(false),
  type: z.nativeEnum(ChainType).default(ChainType.Offchain),
  base: z.nativeEnum(ChainBase),

  // hidden optional params
  alt_wallet_url: z.string().url().optional(),
  eth_chain_id: z.coerce.number().optional(),
  cosmos_chain_id: z.string().optional(),
  address: z.string().optional(),
  decimals: z.number().optional(),
  substrate_spec: z.string().optional(),
  bech32_prefix: z.string().optional(),
  token_name: z.string().optional(),

  // deprecated params to be removed
  node_url: z.string().url(),
  network: z.nativeEnum(ChainNetwork),
  default_symbol: z.string().max(9),
  website: z.string().url().optional(),
  github: z.string().url().startsWith('https://github.com/').optional(),
  telegram: z.string().url().startsWith('https://t.me/').optional(),
  element: z.string().url().startsWith('https://matrix.to/').optional(),
  discord: z.string().url().startsWith('https://discord.com/').optional(),
});
