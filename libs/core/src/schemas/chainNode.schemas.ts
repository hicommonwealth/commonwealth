import z from 'zod';

export const ChainNode = z.object({
  id: z.number().int(),
  url: z.string().max(255),
  eth_chain_id: z.number().int().optional(),
  alt_wallet_url: z.string().max(255).optional(),
  private_url: z.string().max(255).optional(),
  balance_type: z.string().max(255).optional(),
  name: z.string().max(255),
  description: z.string().max(255).optional(),
  ss58: z.number().int().optional(),
  bech32: z.string().max(255).optional(),
  created_at: z.any(),
  updated_at: z.any(),
  cosmos_chain_id: z
    .string()
    .regex(/[a-z0-9]+/)
    .optional(),
  health: z.string().max(255).optional(),
});
