import { z } from 'zod';

export const CommunityIndexer = z.object({
  id: z.string(),
  status: z.enum(['idle', 'pending', 'error']),
  last_checked: z.coerce.date().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const ClankerToken = z.object({
  id: z.number().nullish(),
  created_at: z.string().datetime().nullish(),
  tx_hash: z.string().nullish(),
  contract_address: z.string(),
  requestor_fid: z.number().nullish(),
  name: z.string(),
  symbol: z.string(),
  img_url: z.string().url(),
  pool_address: z.string().nullish(),
  cast_hash: z.string().nullish(),
  type: z.string().nullish(),
  pair: z.string().nullish(),
  presale_id: z.any().nullish(),
});
