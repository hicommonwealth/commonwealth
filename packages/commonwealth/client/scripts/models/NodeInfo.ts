class NodeInfo {
  public readonly id: number;
  public readonly url: string;
  public readonly name: string;
  public readonly ethChainId?: number;
  public readonly altWalletUrl?: string;

  constructor({ id, url, eth_chain_id, alt_wallet_url, name }) {
    this.id = id;
    this.url = url;
    this.ethChainId = eth_chain_id;
    this.altWalletUrl = alt_wallet_url;
    this.name = name;
  }

  public static fromJSON(json) {
    return new NodeInfo(json);
  }
}

export default NodeInfo;
