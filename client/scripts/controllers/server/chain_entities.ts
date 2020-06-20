/* eslint-disable no-restricted-syntax */
import { get } from 'lib/util';

import { ChainEntityStore } from 'stores';
import { ChainEntity, ChainEvent } from 'models';
import { SubstrateEventKind, SubstrateEntityKind, ISubstratePreimageNoted } from 'events/edgeware/types';

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
    const options: any = { chain };
    if (!loadIncompleteEntities) {
      options.completed = true;
    }
    // TODO: Change to GET /entities
    return get('/bulkEntities', options, (result) => {
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
