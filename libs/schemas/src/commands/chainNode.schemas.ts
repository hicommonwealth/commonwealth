import { z } from 'zod';

export const ChainNodeSchema = z.object({
  url: z.string(),
  ethChainId: z.number(),
  name: z.string(),
  eth_chain_id: z.number().optional(), // for backwards compatibility
});

export type ChainNode = z.infer<typeof ChainNodeSchema>;
