import { Log } from '@ethersproject/providers';
import { EvmEventSourceAttributes } from '@hicommonwealth/model';
import { AbiType } from '@hicommonwealth/shared';
import { ethers } from 'ethers';

export type EvmEvent = {
  eventSource: {
    kind: string;
    chainNodeId: number;
    eventSignature: string;
  };
  parsedArgs: ethers.utils.Result;
  rawLog: Log;
};

export type AbiSignatures = {
  abi: AbiType;
  sources: EvmEventSourceAttributes[];
};

export type ContractSources = {
  [contractAddress: string]: AbiSignatures;
};

export type EvmSource = {
  rpc: string;
  contracts: ContractSources;
};

export type EvmSources = {
  [chainNodeId: string]: EvmSource;
};
