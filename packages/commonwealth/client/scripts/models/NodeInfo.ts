class NodeInfo {
  public readonly id: number;
  public readonly name: string;
  public readonly url: string;
  public readonly ethChainId?: number;
  public readonly cosmosChainId?: string;
  public readonly altWalletUrl?: string;
  public readonly balanceType?: string;
  public readonly bech32?: string;
  public readonly cosmosGovernanceVersion?: string;
  public readonly block_explorer?: string;
  public readonly slip44?: number;
  public readonly alchemyMetadata?: object;

  constructor({
    id,
    name,
    url,
    eth_chain_id,
    cosmos_chain_id,
    alt_wallet_url,
    balance_type,
    bech32,
    cosmos_gov_version,
    block_explorer,
    slip44,
    alchemy_metadata,
  }) {
    this.id = id;
    this.name = name;
    this.url = url;
    this.ethChainId = eth_chain_id;
    this.cosmosChainId = cosmos_chain_id;
    this.altWalletUrl = alt_wallet_url;
    this.balanceType = balance_type;
    this.bech32 = bech32;
    this.cosmosGovernanceVersion = cosmos_gov_version;
    this.block_explorer = block_explorer;
    this.slip44 = slip44;
    this.alchemyMetadata = alchemy_metadata;
  }

  public static fromJSON(json) {
    return new NodeInfo(json);
  }
}

export default NodeInfo;
