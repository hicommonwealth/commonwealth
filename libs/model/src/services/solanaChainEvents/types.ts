import { Event } from '@coral-xyz/anchor';
import { EventPair, OutboxEvents } from '@hicommonwealth/schemas';

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

export type SolanaEvent = {
  eventSource: {
    chainId: string; // Solana uses string chain IDs (mainnet, devnet, testnet)
    programId: string;
  };
  transaction: SolanaTransactionInfo;
  slot: SolanaSlotDetails;
  log: SolanaLogInfo;
  event_name?: string; // Name of the event
};

export type SolanaMapper<E extends OutboxEvents> = (
  solanaEvent: Event,
) => EventPair<E>;
