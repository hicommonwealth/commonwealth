import { Log } from '@ethersproject/providers';
import {
  events as EventSchemas,
  EvmEventSource,
} from '@hicommonwealth/schemas';
import { AbiType } from '@hicommonwealth/shared';
import { ethers } from 'ethers';
import { z } from 'zod';

export type EvmEvent = {
  eventSource: {
    ethChainId: number;
    eventSignature: string;
  };
  parsedArgs: ethers.utils.Result;
  rawLog: Log;
  block?: z.infer<typeof EventSchemas.BlockDetails>;
};

const sourceType = EvmEventSource.extend({
  contract_name: z.string().optional(),
  parent_contract_address: z.string().optional(),
});

export type AbiSignatures = {
  abi: AbiType;
  sources: Array<z.infer<typeof sourceType>>;
};

export type ContractSources = {
  [contractAddress: string]: AbiSignatures;
};

export type EvmSource = {
  rpc: string;
  maxBlockRange: number;
  contracts: ContractSources;
};

export type EvmSources = {
  [ethChainId: string]: EvmSource;
};
