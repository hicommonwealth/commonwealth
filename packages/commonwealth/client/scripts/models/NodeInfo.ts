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
  }

  public static fromJSON(json) {
    return new NodeInfo(json);
  }
}

export default NodeInfo;
