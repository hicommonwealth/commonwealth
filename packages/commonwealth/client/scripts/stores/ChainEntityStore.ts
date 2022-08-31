import { IChainEntityKind } from 'chain-events/src';

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

  public getByType(type: IChainEntityKind, keepEmpty = false) {
    if (this._storeType[type]) {
      return Object.values(this._storeType[type]).filter((e) => keepEmpty || e.chainEvents.length > 0);
    } else {
      return [];
    }
  }

  public getByUniqueData(chain: string, type: IChainEntityKind, type_id: string) {
    const entities = this.getByType(type, true);
    for (const entity of entities) {
      if (entity.chain === chain && entity.typeId === type_id) {
        return entity;
      }
    }
  }
}

export default ChainEntityStore;
