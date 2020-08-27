import { IChainEntityKind } from '@commonwealth/chain-events';

import { ChainEntity } from '../models';
import Store from './Store';

class ChainEntityStore extends Store<ChainEntity> {
  private _storeType: { [type: string]: { [stringId: string]: ChainEntity } } = { };

  public get(entity: ChainEntity) {
    return this._store.find((e) => e.eq(entity));
  }

  public add(entity: ChainEntity) {
    // override duplicates manually
    const existingEntity = this.get(entity);
    if (existingEntity) {
      this.remove(entity);
    }

    // add as if new
    super.add(entity);
    if (!this._storeType[entity.type]) {
      this._storeType[entity.type] = {};
    }
    this._storeType[entity.type][entity.stringId] = entity;
    return this;
  }

  public remove(entity: ChainEntity) {
    super.remove(entity, (e) => e.eq(entity));
    if (this._storeType[entity.type] && this._storeType[entity.type][entity.stringId]) {
      delete this._storeType[entity.type][entity.stringId];
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
