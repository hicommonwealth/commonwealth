interface APIResponseFormat {
  id: number;
  community_id: string;
  metadata: {
    name: string;
    description?: string;
    required_requirements?: number;
  };
  requirements: {
    rule: 'threshold';
    source: {
      source_type:
        | 'erc20'
        | 'erc721'
        | 'erc1155'
        | 'cosmos_native'
        | 'eth_native'
        | 'cw721';
      evm_chain_id?: number;
      cosmos_chain_id?: number;
      contract_address?: string;
      token_symbol?: string;
      token_id?: string;
    };
  }[];
  topics: any[];
  memberships: any[];
  updated_at: string;
  created_at: string;
}

class Group {
  public id: number;
  public communityId: string;
  public createdAt: string; // ISO string
  public updatedAt: string; // ISO string
  public name: string;
  public description?: string;
  public requirements: any[];
  public topics: any[];
  public members: any[];
  public requirementsToFulfill: number;

  constructor({
    id,
    community_id,
    created_at,
    updated_at,
    metadata,
    requirements,
    topics,
    memberships,
  }: APIResponseFormat) {
    this.id = id;
    this.communityId = community_id;
    this.createdAt = created_at;
    this.updatedAt = updated_at;
    this.name = metadata.name;
    this.description = metadata.description;
    this.requirements = requirements;
    this.topics = topics;
    this.members = memberships;
    this.requirementsToFulfill = metadata.required_requirements;
  }
}

export default Group;
