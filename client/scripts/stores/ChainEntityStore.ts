import { IChainEntityKind } from 'events/interfaces';

import IdStore from './IdStore';
import { ChainEntity } from '../models';

class ChainEntityStore extends IdStore<ChainEntity> {
  private _storeType: { [type: string]: { [id: number]: ChainEntity } } = { };

  public add(entity: ChainEntity) {
    // override duplicates manually
    if (this.getById(entity.id)) {
      this.remove(entity);
    }

    // add as if new
    super.add(entity);
    if (!this._storeType[entity.type]) {
      this._storeType[entity.type] = {};
    }
    this._storeType[entity.type][entity.id] = entity;
    return this;
  }

  public remove(entity: ChainEntity) {
    super.remove(entity);
    if (this._storeType[entity.type] && this._storeType[entity.type][entity.id]) {
      delete this._storeType[entity.type][entity.id];
    }
    return this;
  }

  public clear() {
    super.clear();
    this._storeType = {};
  }

  public getByType(type: IChainEntityKind) {
    if (this._storeType[type]) {
      return Object.values(this._storeType[type]);
    } else {
      return [];
    }
  }
}

export default ChainEntityStore;
