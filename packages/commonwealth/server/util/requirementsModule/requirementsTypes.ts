type ContractSource = {
  source_type: 'erc20' | 'erc721' | 'erc1155';
  evm_chain_id: number;
  contract_address: string;
  token_id?: string;
};

type NativeSource = {
  source_type: 'eth_native';
  evm_chain_id: number;
};

type CosmosSource = {
  source_type: 'cosmos_native';
  cosmos_chain_id: string;
  token_symbol: string;
};

export type ThresholdData = {
  threshold: string;
  source: ContractSource | NativeSource | CosmosSource;
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
