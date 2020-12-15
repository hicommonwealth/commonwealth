import { IHasId } from './interfaces';
import Store from './Store';

class IdStore<T extends IHasId> extends Store<T> {
  private _storeId: { [id: string]: T} = {};

  public add(n: T) {
    super.add(n);
    this._storeId[n.id.toString()] = n;
    return this;
  }

  public remove(n: T) {
    super.remove(n);
    delete this._storeId[n.id.toString()];
    return this;
  }

  public update(n: T) {
    super.update(n);
    this._storeId[n.id.toString()] = n;
    return this;
  }

  public clear() {
    super.clear();
    this._storeId = {};
  }

  public getById(id: number | string): T {
    if (!id) return undefined;
    return this._storeId[id.toString()];
  }
}

export default IdStore;
