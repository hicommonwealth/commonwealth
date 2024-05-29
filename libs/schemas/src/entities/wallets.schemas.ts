import { MAX_SCHEMA_INT, MIN_SCHEMA_INT } from '@hicommonwealth/shared';
import { z } from 'zod';

export const Wallets = z.object({
  id: z.number().int().min(MIN_SCHEMA_INT).max(MAX_SCHEMA_INT).optional(),
  user_id: z.number().int(),
  user_address: z.string().startsWith('0x').length(42),
  relay_address: z.string().startsWith('0x').length(42),
  wallet_address: z.string().startsWith('0x').length(42),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});
