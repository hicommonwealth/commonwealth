import IdStore from './IdStore';
import { NodeInfo } from '../models';

class NodeStore extends IdStore<NodeInfo> {
  private _storeChain: { [chain: string]: NodeInfo[] } = {};

  public add(n: NodeInfo) {
    super.add(n);
    if (!this._storeChain[n.chain.id]) {
      this._storeChain[n.chain.id] = [];
    }
    this._storeChain[n.chain.id].push(n);
    return this;
  }

  public remove(n: NodeInfo) {
    super.remove(n);
    this._storeChain[n.chain.id] = this._storeChain[n.chain.id].filter((x) => x !== n);
    return this;
  }

  public clear() {
    super.clear();
    this._storeChain = {};
  }

  public getByChain(chainId: string) {
    return this._storeChain[chainId];
  }
}

export default NodeStore;
