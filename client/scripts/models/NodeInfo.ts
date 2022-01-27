import ChainInfo from './ChainInfo';

class NodeInfo {
  public readonly id: number;
  public readonly chain: ChainInfo;
  public readonly url: string;
  public readonly address?: string;
  public readonly tokenName?: string;
  public readonly ethChainId?: number;
  public readonly altWalletUrl?: string;

  constructor({
    id,
    chain,
    url,
    address,
    token_name,
    eth_chain_id,
    alt_wallet_url,
  }) {
    this.id = id;
    this.chain = chain;
    this.url = url;
    this.address = address;
    this.tokenName = token_name;
    this.ethChainId = eth_chain_id;
    this.altWalletUrl = alt_wallet_url;
  }
  public static fromJSON(json) {
    return new NodeInfo(json);
  }

  public get topics() {
    return this.chain.topics;
  }
}

export default NodeInfo;
