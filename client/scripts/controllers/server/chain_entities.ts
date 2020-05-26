/* eslint-disable no-restricted-syntax */
import { default as $ } from 'jquery';
import { default as _ } from 'lodash';

import { ChainEntityStore } from 'stores';
import { ChainEntity, ChainEvent } from 'models';
import app from 'state';
import { SubstrateEventKind, SubstrateEntityKind, ISubstratePreimageNoted } from 'events/edgeware/types';

const get = (route, args, callback) => {
  return $.get(app.serverUrl() + route, args).then((resp) => {
    if (resp.status === 'Success') {
      callback(resp.result);
    } else {
      console.error(resp);
    }
  }).catch((e) => console.error(e));
};

class ChainEntityController {
  private _store: ChainEntityStore = new ChainEntityStore();
  public get store() { return this._store; }

  public constructor() {
    // do nothing
  }

  public getPreimage(hash: string) {
    const preimage = this.store.getByType(SubstrateEntityKind.DemocracyPreimage)
      .find((preimageEntity) => preimageEntity.typeId === hash);
    if (preimage) {
      const notedEvent = preimage.chainEvents.find((event) => event.data.kind === SubstrateEventKind.PreimageNoted);
      return (notedEvent.data as ISubstratePreimageNoted).preimage;
    } else {
      return null;
    }
  }

  public update(entity: ChainEntity, event: ChainEvent) {
    const existingEntity = this.store.get(entity);
    if (!existingEntity) {
      this._store.add(entity);
    } else {
      entity = existingEntity;
    }
    entity.addEvent(event);
  }

  public refresh(chain: string, loadIncompleteEntities: boolean = false) {
    // TODO: add a way on route to only get completed entities if set to true
    //  for now, it duplicates the data from chain, but shouldn't affect the results.
    if (!loadIncompleteEntities) return Promise.resolve();
    return get('/bulkEntities', { chain }, (result) => {
      for (const entityJSON of result) {
        const entity = ChainEntity.fromJSON(entityJSON);
        this._store.add(entity);
      }
    });
  }

  public deinit() {
    this.store.clear();
  }
}

export default ChainEntityController;
