import { z } from 'zod';

export const CeEventSource = z.object({
  eth_chain_id: z.number(),
  contract_address: z.string(),
  event_signature: z.string(),
  meta: z.union([
    z.object({
      events_migrated: z.literal(true),
      quest_action_meta_id: z.string().optional(),
    }),
    z.object({
      events_migrated: z.literal(false),
      created_at_block: z.number(),
    }),
  ]),
});

export type ContractSources = {
  [contractAddress: string]: Array<z.infer<typeof CeEventSource>>;
};

export type EvmSource = {
  rpc: string;
  maxBlockRange: number;
  contracts: ContractSources;
};

export type EvmSources = {
  [ethChainId: string]: EvmSource;
};
