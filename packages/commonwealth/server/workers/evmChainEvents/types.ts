import { EvmEventSource } from '@hicommonwealth/schemas';
import { z } from 'zod';

const sourceType = EvmEventSource.extend({
  contract_name: z.string().optional(),
  parent_contract_address: z.string().optional(),
});

export type ContractSources = {
  [contractAddress: string]: Array<z.infer<typeof sourceType>>;
};

export type EvmSource = {
  rpc: string;
  maxBlockRange: number;
  contracts: ContractSources;
};

export type EvmSources = {
  [ethChainId: string]: EvmSource;
};
