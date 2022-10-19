import { BalanceType } from 'common-common/src/types';
import BN from 'bn.js';

// map of addresses to balances
export interface ICache {
  [cacheKey: string]: {
    balance: string,
    fetchedAt: moment.Moment;
  }
}

export type IChainNode = {
  id: number;
  url: string;
  eth_chain_id?: number;
  alt_wallet_url?: string;
  private_url?: string;
  balance_type?: BalanceType;
  chain_base: string;
  name: string;
  description?: string;
  ss58?: number;
  bech32?: string;
}

export type ChainNodeResp = {
  id: number,
  name: string,
  description?: string,
  base: string,
  prefix?: string,
};

export type BalanceProvider = {
  name: string;
  opts: Record<string, string>;
  getBalance(node: IChainNode, address: string, opts: Record<string, string>): Promise<string>;
}

export type BalanceProviderResp = {
  bp: string;
  opts: Record<string, string>;
}

export type TokenBalanceResp = {
  balances: { [address: string]: string },
  errors: { [address: string]: string },
};

export type ITokenBalanceCache = {
  getChainNodes(): Promise<ChainNodeResp[]>;
  getBalanceProviders(nodeId: number): Promise<BalanceProviderResp[]>;
  getBalances(
    nodeId: number,
    addresses: string[],
    balanceProvider: string,
    opts: Record<string, string>, // TODO: if we want, we can add ts overrides
  ): Promise<TokenBalanceResp>;
}

const ContractTypes = ['erc20', 'erc721', 'spl-token'] as const;
export type ContractType = typeof ContractTypes[number];
export function parseContractType(arg: string): ContractType {
  const ct = ContractTypes.find((validName) => validName === arg);
  if (ct) return ct;
  throw new Error('Invalid contract type');
}