import { EventPair, Events } from '@hicommonwealth/schemas';

export type EvmBlockDetails = {
  number: bigint;
  hash: string;
  logsBloom: string;
  nonce?: string;
  parentHash: string;
  timestamp: bigint;
  miner: string;
  gasLimit: bigint;
};

export type Log = {
  blockNumber: bigint;
  blockHash: string;
  transactionIndex: number;

  removed: boolean;

  address: string;
  data: string;

  topics: Array<string>;

  transactionHash: string;
  logIndex: number;
};

type EvmEventMeta = (
  | {
      events_migrated: true;
      quest_action_meta_id?: number;
    }
  | {
      events_migrated: false;
      created_at_block: number;
    }
) & { event_name?: Events };

export type EvmEvent = {
  eventSource: {
    ethChainId: number;
    eventSignature: string;
  };
  rawLog: Log;
  block: EvmBlockDetails;
  meta: EvmEventMeta;
};

export type EvmMapper<E extends Events> = (evmEvent: EvmEvent) => EventPair<E>;

export type EvmEventSource = {
  eth_chain_id: number;
  contract_address: string;
  event_signature: string;
  meta: EvmEventMeta;
};

export type EvmContractSources = {
  [contractAddress: string]: Array<EvmEventSource>;
};

export type EvmChainSource = {
  rpc: string;
  maxBlockRange: number;
  contracts: EvmContractSources;
};

export type EvmSources = {
  [ethChainId: string]: EvmChainSource;
};
