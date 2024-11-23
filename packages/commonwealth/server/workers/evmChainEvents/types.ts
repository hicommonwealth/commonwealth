import { Log } from '@ethersproject/providers';
import { EvmEventSourceAttributes } from '@hicommonwealth/model';
import { AbiType } from '@hicommonwealth/shared';
import { ethers } from 'ethers';

export type EvmEvent = {
  eventSource: {
    ethChainId: number;
    eventSignature: string;
  };
  parsedArgs: ethers.utils.Result;
  rawLog: Log;
};

export type AbiSignatures = {
  abi: AbiType;
  sources: Array<EvmEventSourceAttributes & { contract_name?: string }>;
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
