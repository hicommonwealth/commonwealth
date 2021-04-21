import ChainInfo from './ChainInfo';

class NodeInfo {
  public readonly id: number;
  public readonly chain: ChainInfo;
  public readonly url: string;
  public readonly address: string;
  public readonly isUninitialized: boolean;

  constructor(id, chain, url, address?, isUninitialized?) {
    this.id = id;
    this.chain = chain;
    this.url = url;
    this.address = address;
    this.isUninitialized = isUninitialized;
  }
  public static fromJSON(json) {
    return new NodeInfo(json.id, json.chain, json.url, json.address);
  }

  public get topics() {
    return this.chain.topics;
  }
}

export default NodeInfo;
