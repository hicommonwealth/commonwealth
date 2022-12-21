import { BalanceType } from 'common-common/src/types';

// map of addresses to balances
export interface ICache {
  [cacheKey: string]: {
    balance: string,
    fetchedAt: number;
  }
}

export enum FetchTokenBalanceErrors {
  NoBalanceProvider = 'Balance provider not found',
  UnsupportedContractType = 'Unsupported contract type',
}

export type IChainNode = {
  id: number;
  url: string;
  eth_chain_id?: number;
  alt_wallet_url?: string;
  private_url?: string;
  balance_type: BalanceType;
  name: string;
  description?: string;
  ss58?: number;
  bech32?: string;
}

export type ChainNodeResp = {
  id: number,
  name: string,
  description?: string,
  base: BalanceType,
  prefix?: string,
};

export abstract class BalanceProvider<OptT extends Record<string, unknown> = Record<string, unknown>> {
  public readonly name: string;
  public readonly opts: Record<keyof OptT, string>;
  public abstract readonly validBases: BalanceType[];

  public getCacheKey(node: IChainNode, address: string, opts: OptT): string {
    return `${node.id}-${address}`;
  }

  public abstract getBalance(node: IChainNode, address: string, opts: OptT): Promise<string>;
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
  getBalancesForAddresses(
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