import { ChainBase } from 'types';

class NodeInfo {
  public readonly id: number;
  public readonly url: string;
  public readonly ethChainId?: number;
  public readonly altWalletUrl?: string;
  public readonly base: ChainBase;

  constructor({
    id,
    url,
    eth_chain_id,
    alt_wallet_url,
    base,
  }) {
    this.id = id;
    this.url = url;
    this.ethChainId = eth_chain_id;
    this.altWalletUrl = alt_wallet_url;
    this.base = base;
  }
  public static fromJSON(json) {
    return new NodeInfo(json);
  }
}

export default NodeInfo;
