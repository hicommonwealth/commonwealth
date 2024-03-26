import { AbiType } from '@hicommonwealth/core';
import { EvmEventSourceAttributes } from '@hicommonwealth/model';
import { ethers } from 'ethers';

export type RawEvmEvent = {
  kind: string;
  contractAddress: string;
  blockNumber: number;
  args: ethers.utils.Result;
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
