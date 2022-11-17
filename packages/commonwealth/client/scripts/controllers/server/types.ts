// Types for handling server API requests from the client side.

import { Request, Response } from 'express';
import { BalanceType, ContractType } from 'common-common/src/types';

export type TypedResponse<T> = Response<
  { result: T } & { status: 'Success' | 'Failure' | number }
>;

export type ChainNodeAttributes = {
  url: string;
  id?: number;
  eth_chain_id?: number;
  alt_wallet_url?: string;
  private_url?: string;
  balance_type: BalanceType;
  name: string;
  description?: string;
};

export type ContractAttributes = {
  id: number;
  address: string;
  chain_node_id: number;
  abi_id?: number;
  decimals?: number;
  token_name?: string;
  symbol?: string;
  type: string;
  is_factory?: boolean;
  nickname?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ContractAbiAttributes = {
  id: number;
  abi: Array<Record<string, unknown>>;
};

export type CreateContractResp = {
  contract: ContractAttributes;
};

export type CreateContractAbiResp = {
  contractAbi: ContractAbiAttributes;
  contract: ContractAttributes;
};
