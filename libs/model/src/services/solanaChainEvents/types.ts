import { EventPair, Events } from '@hicommonwealth/schemas';

export type SolanaSlotDetails = {
  slot: number;
  blockhash: string;
  parentSlot: number;
  timestamp: number; // Unix timestamp in seconds
};

export type SolanaTransactionInfo = {
  signature: string;
  slot: number;
  blockTime: number; // Unix timestamp in seconds
};

export type SolanaLogInfo = {
  signature: string;
  slot: number;
  blockTime: number;
  programId: string;
  logs: string[];
  data?: string;
};

type SolanaEventMeta = (
  | {
      events_migrated: true;
      quest_action_meta_ids?: number[];
    }
  | {
      events_migrated: false;
      created_at_slot: number;
    }
) & { event_name?: Events };

export type SolanaEvent = {
  eventSource: {
    chainId: string; // Solana uses string chain IDs (mainnet, devnet, testnet)
    programId: string;
    eventType: string;
  };
  transaction: SolanaTransactionInfo;
  slot: SolanaSlotDetails;
  log: SolanaLogInfo;
  meta: SolanaEventMeta;
};

export type SolanaMapper<E extends Events> = (
  solanaEvent: SolanaEvent,
) => EventPair<E>;
