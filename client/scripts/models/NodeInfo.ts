import ChainInfo from './ChainInfo';

class NodeInfo {
  public readonly id: number;
  public readonly chain: ChainInfo;
  public readonly url: string;
  public readonly address: string;

  constructor(id, chain, url, address?) {
    this.id = id;
    this.chain = chain;
    this.url = url;
    this.address = address;
  }
  public static fromJSON(json) {
    return new NodeInfo(json.id, json.chain, json.url, json.address);
  }

  public get topics() {
    return this.chain.topics;
  }
}

export default NodeInfo;
