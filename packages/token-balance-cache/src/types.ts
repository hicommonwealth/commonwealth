import BN from 'bn.js';

const ContractTypes = ['erc20', 'erc721', 'spl-token'] as const;
export type ContractType = typeof ContractTypes[number];
export function parseContractType(arg: string): ContractType {
  const ct = ContractTypes.find((validName) => validName === arg);
  if (ct) return ct;
  throw new Error('Invalid contract type');
}

export type ChainNodeT = {
  id: number;
  url: string;
  eth_chain_id?: number;
  alt_wallet_url?: string;
  private_url?: string;
  name?: string;
  description?: string;
}

export type BalanceProviderT<OptsT = {}> = {
  // unique identifier of the balance provider 
  name: string;

  // gets a cache key specific to the node/address/provider
  getCacheKey(node: ChainNodeT, address: string, opts: OptsT): string;

  // gets the token balance given provided arguments
  getBalance(node: ChainNodeT, address: string, opts: OptsT): Promise<BN>;
}
