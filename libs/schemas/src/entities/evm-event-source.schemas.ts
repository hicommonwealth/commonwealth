import { ChildContractNames } from '@hicommonwealth/evm-protocols';
import { EVM_ADDRESS } from '@hicommonwealth/schemas';
import { z } from 'zod';

export const EvmEventSource = z.object({
  eth_chain_id: z.number(),
  contract_address: EVM_ADDRESS,
  event_signature: z.string(),
  contract_name: z.nativeEnum(ChildContractNames),
  parent_contract_address: EVM_ADDRESS,
  created_at_block: z.number(),
  events_migrated: z.boolean(),
});
