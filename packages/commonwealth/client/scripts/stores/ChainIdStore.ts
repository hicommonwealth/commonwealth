import { IHasChainId } from './interfaces';
import Store from './Store';

class ChainIdStore<T extends IHasChainId> extends Store<T> {
  private _storeChainId: { [chainId: string]: T } = {};

  public add(n: T) {
    super.add(n);
    this._storeChainId[n.chainId] = n;
    return this;
  }

  public remove(n: T) {
    super.remove(n);
    delete this._storeChainId[n.chainId.toString()];
    return this;
  }

  public update(n: T) {
    super.update(n, (a) => a.chainId === n.chainId);
    this._storeChainId[n.chainId.toString()] = n;
    return this;
  }

  public clear() {
    super.clear();
    this._storeChainId = {};
  }

  public getByChain(chainId: string): T {
    return this._storeChainId[chainId];
  }
}

export default ChainIdStore;
