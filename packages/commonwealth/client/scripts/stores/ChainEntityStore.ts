import { IChainEntityKind } from 'chain-events/src';

import { ChainEntity } from '../models';
import Store from './Store';
import {proposalSlugToChainEntityType} from "identifiers";
import {ProposalType} from "common-common/src/types";

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

  public getById(id: number) {
    for (const entityDict of Object.values(this._storeType)) {
      for (const entity of Object.values(entityDict)) {
        if (id === entity.id) return entity;
      }
    }
    return null;
  }

  /**
   * Returns the entity that matches the given chain and uniqueId
   * @param chain
   * @param uniqueId A root id e.g. 'treasuryproposal_10'. Note the uniqueId given is not the same as the chain-entity
   *                 type and type_id e.g. type = 'treasury-proposal' and type_id = '10'.
   */
  public getByUniqueId(chain: string, uniqueId: string) {
    const [slug, type_id] = uniqueId.split('_');
    const type = proposalSlugToChainEntityType(<ProposalType>slug);

    const entities = this.getByType(type, true);
    for (const entity of entities) {
      if (entity.chain == chain && entity.typeId == type_id) {
        return entity;
      }
    }
  }
}

export default ChainEntityStore;
