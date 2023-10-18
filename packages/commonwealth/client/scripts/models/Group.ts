interface APIResponseFormat {
  id: number;
  chain_id: string;
  metadata: {
    name: string;
    description?: string;
  };
  requirements: {
    rule: 'threshold';
    source: {
      source_type: 'erc20' | 'erc721' | 'cosmos_native' | 'eth_native';
      evm_chain_id?: number;
      cosmos_chain_id?: number;
      contract_address?: string;
      token_symbol?: string;
    };
  }[];
  topicIds: number[];
  updated_at: string;
  created_at: string;
}

class Group {
  public id: number;
  public chainId: string;
  public createdAt: string; // ISO string
  public updatedAt: string; // ISO string
  public name: string;
  public description?: string;
  public requirements: any[];
  public topicIds: number[];

  constructor({
    id,
    chain_id,
    created_at,
    updated_at,
    metadata,
    requirements,
    topicIds,
  }: APIResponseFormat) {
    this.id = id;
    this.chainId = chain_id;
    this.createdAt = created_at;
    this.updatedAt = updated_at;
    this.name = metadata.name;
    this.description = metadata.description;
    this.requirements = requirements;
    this.topicIds = topicIds;
  }
}

export default Group;
