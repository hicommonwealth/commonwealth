export type ContractSource = {
  source_type:
    | BalanceSourceType.ERC20
    | BalanceSourceType.ERC721
    | BalanceSourceType.ERC1155;
  evm_chain_id: number;
  contract_address: string;
  token_id?: string;
};

export type NativeSource = {
  source_type: BalanceSourceType.ETHNative;
  evm_chain_id: number;
};

export type CosmosSource = {
  source_type: BalanceSourceType.CosmosNative;
  cosmos_chain_id: string;
  token_symbol: string;
};

export type CosmosContractSource = {
  source_type: BalanceSourceType.CW721;
  cosmos_chain_id: string;
  contract_address: string;
};

export type ThresholdData = {
  threshold: string;
  source: ContractSource | NativeSource | CosmosSource | CosmosContractSource;
};

export type AllowlistData = {
  allow: string[];
};

export type Requirement =
  | {
      rule: 'threshold';
      data: ThresholdData;
    }
  | {
      rule: 'allow';
      data: AllowlistData;
    };

export enum BalanceSourceType {
  ETHNative = 'eth_native',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  ERC1155 = 'erc1155',
  CosmosNative = 'cosmos_native',
  CW721 = 'cw721',
}
