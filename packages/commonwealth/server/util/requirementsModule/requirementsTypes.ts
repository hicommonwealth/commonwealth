type ContractSource = {
  source_type: 'erc20' | 'erc721';
  evm_chain_id: 1;
  contract_address: string;
};

type NativeSource = {
  source_type: 'eth_native';
  evm_chain_id: 1;
};

type CosmosSource = {
  source_type: 'cosmos_native';
  cosmos_chain_id: string;
  token_symbol: string;
};
type ThresholdData = {
  threshold: string;
  source: ContractSource | NativeSource | CosmosSource;
};

type AllowlistData = {
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
