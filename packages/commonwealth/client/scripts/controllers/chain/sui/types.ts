import { Coin } from 'adapters/currency';

// Basic interface for Sui coins
export interface SuiCoin extends Coin {
  type: string; // The full type identifier for the coin (e.g., "0x2::sui::SUI")
  balance: string; // Balance as a string
  objectId?: string; // The object ID for the coin (if applicable)
}

// Structure for Sui objects
export interface SuiObject {
  objectId: string;
  version: string;
  digest: string;
  type: string;
  owner: string;
  previousTransaction: string;
}

// Token type used for gating/permission checks
export interface SuiToken {
  type: string;
  name: string;
  symbol: string;
  decimals: number;
  supply?: string;
  iconUrl?: string;
}

// Balance information for a wallet address
export interface SuiBalance {
  owner: string;
  coins: SuiCoin[];
}
