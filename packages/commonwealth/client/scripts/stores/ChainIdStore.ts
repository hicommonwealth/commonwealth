import { IHasChainId } from './interfaces';
import Store from './Store';

class ChainIdStore<T extends IHasChainId> extends Store<T> {
  private _storeChainId: { [chainId: string]: Array<T> } = {};
  private _sortingFunction: (a: T, b: T) => number;

  constructor(sortingFunction: (a: T, b: T) => number) {
    super();
    this._sortingFunction = sortingFunction;
  }

  public add(n: T): ChainIdStore<T> {
    super.add(n);

    // Create chain-scoped store if it does not exist
    if (!this._storeChainId[n.chainId]) {
      this._storeChainId[n.chainId] = [] as Array<T>;
    }

    // Add to chain-scoped store
    this._storeChainId[n.chainId].push(n);

    // Sort store
    if (this._sortingFunction) {
      this._storeChainId[n.chainId].sort(this._sortingFunction);
    }

    return this;
  }

  public remove(n: T): ChainIdStore<T> {
    const idx = this._storeChainId[n.chainId].indexOf(n);
    if (idx === -1) throw new Error('Object not in store.');
    this._storeChainId[n.chainId].splice(idx, 1);
    return this;
  }

  public update(n: T, eqFn: (a: T) => boolean): ChainIdStore<T> {
    const idx = this._storeChainId[n.chainId].findIndex(eqFn);
    if (idx === -1) throw new Error('Object not in store.');
    this._storeChainId[n.chainId][idx] = n;
    return this;
  }

  public clear(): ChainIdStore<T> {
    super.clear();
    this._storeChainId = {};
    return this;
  }

  public getByChainId(chainId: string): Array<T> {
    return this._storeChainId[chainId];
  }
}

export default ChainIdStore;
