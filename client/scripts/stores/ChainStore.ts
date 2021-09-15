import IdStore from './IdStore';
import { ChainInfo } from '../models';

class ChainStore extends IdStore<ChainInfo> {
  private _chainId: { [id: string]: ChainInfo} = {};

  public add(n: ChainInfo) {
    super.add(n);
    this._chainId[n.id.toString()] = n;
    return this;
  }

  public remove(n: ChainInfo) {
    super.remove(n);
    delete this._chainId[n.id.toString()];
    return this;
  }

  public update(n: ChainInfo) {
    super.update(n);
    this._chainId[n.id.toString()] = n;
    return this;
  }

  public clear() {
    super.clear();
    this._chainId = {};
  }
  
  public getByChainId(id: number): ChainInfo {
    if (!id) return undefined;
    return this._chainId[id.toString()];
  }
}

export default ChainStore;
