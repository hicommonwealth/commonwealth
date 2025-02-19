import { EVM_ADDRESS } from '@hicommonwealth/schemas';
import { z } from 'zod';

export const ChainEventXpSource = z.object({
  chain_node_id: z.number(),
  contract_address: EVM_ADDRESS,
  event_signature: z.string(),
  quest_action_meta_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
