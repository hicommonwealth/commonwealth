import { Log } from '@ethersproject/providers';
import { EvmEventSource } from '@hicommonwealth/schemas';
import { AbiType } from '@hicommonwealth/shared';
import { ethers } from 'ethers';
import { z } from 'zod';

export type EvmBlockDetails = {
  number: number;
  hash: string;
  logsBloom: string;
  nonce?: string;
  parentHash: string;
  timestamp: number;
  miner: string;
  gasLimit: number;
  gasUsed: number;
};

export type EvmEvent = {
  eventSource: {
    ethChainId: number;
    eventSignature: string;
  };
  parsedArgs: ethers.utils.Result;
  rawLog: Log;
  block?: EvmBlockDetails;
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
