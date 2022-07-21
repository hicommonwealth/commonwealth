import { BalanceType } from 'common-common/src/types';

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
  balance_type?: BalanceType;
  name?: string;
  description?: string;
}
