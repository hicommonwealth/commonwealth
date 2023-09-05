type LengthConstrainedString<N extends number> = string & {
  _lengthConstraint: N;
};

type ContractSource = {
  source_type: 'erc20' | 'erc721';
  chain_id: string;
  contract_address: LengthConstrainedString<42>;
};

type NativeSource = {
  source_type: 'eth_native';
  chain_id: string;
};

type CosmosSource = {
  source_type: 'cosmos_native';
  chain_id: string;
  token_symbol: string;
};
type ThresholdData = {
  threshold: string;
  source: ContractSource | NativeSource | CosmosSource;
};

type AllowlistData = {
  allow: LengthConstrainedString<42>[];
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
