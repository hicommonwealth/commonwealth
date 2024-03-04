import z from 'zod';
import { MAX_SCHEMA_INT, MIN_SCHEMA_INT } from '../constants';

export const Address = z.object({
  id: z.number().int().min(MIN_SCHEMA_INT).max(MAX_SCHEMA_INT).optional(),
  address: z.string().max(255),
  community_id: z.string().max(255),
  user_id: z.number().int().min(MIN_SCHEMA_INT).max(MAX_SCHEMA_INT).optional(),
  verification_token: z.string().max(255).optional(),
  verification_token_expires: z.date().nullable().optional(),
  verified: z.date().nullable().optional(),
  keytype: z.string().max(255).optional(),
  last_active: z.date().nullable().optional(),
  is_councillor: z.boolean().optional(),
  is_validator: z.boolean().optional(),
  ghost_address: z.boolean().optional(),
  profile_id: z
    .number()
    .int()
    .min(MIN_SCHEMA_INT)
    .max(MAX_SCHEMA_INT)
    .optional(),
  wallet_id: z.string().max(255).optional(),
  block_info: z.string().max(255).optional(),
  is_user_default: z.boolean().optional(),
  role: z.enum(['member', 'admin', 'moderator']).default('member'),
  wallet_sso_source: z.string().max(255).optional(),
  hex: z.string().max(64).optional(),
  created_at: z.any(),
  updated_at: z.any(),
});
