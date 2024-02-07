import { AbiType } from '@hicommonwealth/core';
import { ethers } from 'ethers';

export type RawEvmEvent = {
  kind: string;
  contractAddress: string;
  blockNumber: number;
  args: ethers.utils.Result;
};

export type AbiSignatures = {
  abi: AbiType;
  // TODO: change this to a set when kind is removed
  sources: { event_signature: string; kind: string }[];
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
