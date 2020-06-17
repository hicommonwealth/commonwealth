/* eslint-disable no-restricted-syntax */
import { default as $ } from 'jquery';
import { default as _ } from 'lodash';

import { ChainEntityStore } from 'stores';
import { ChainEntity, ChainEvent, ChainEventType, IChainAdapter } from 'models';
import app from 'state';
import {
  CWEvent,
  eventToEntity,
  entityToFieldName,
  IStorageFetcher,
  IEventProcessor,
  IEventSubscriber
} from 'events/interfaces';
import { SubstrateEventKind, SubstrateEntityKind, ISubstratePreimageNoted } from 'events/edgeware/types';

export enum EntityRefreshOption {
  AllEntities = 'all-entities',
  CompletedEntities = 'completed-entities',
  Nothing = 'nothing',
}

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
  private _subscriber: IEventSubscriber<any, any>;

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

  public refresh(chain: string, refreshOption: EntityRefreshOption) {
    if (refreshOption === EntityRefreshOption.Nothing) return;
    const options: any = { chain };
    if (refreshOption === EntityRefreshOption.CompletedEntities) {
      options.completed = true;
    }
    return get('/bulkEntities', options, (result) => {
      for (const entityJSON of result) {
        const entity = ChainEntity.fromJSON(entityJSON);
        this._store.add(entity);
      }
    });
  }

  public deinit() {
    this.store.clear();
    this._subscriber.unsubscribe();
    this._subscriber = undefined;
  }

  // handle a single incoming chain event emitted from client connection with node
  private _handleCWEvent(chain: string, cwEvent: CWEvent): [ ChainEntity, ChainEvent ] {
    // immediately return if no entity involved, event unrelated to proposals/etc
    const eventEntity = eventToEntity(cwEvent.data.kind);
    if (!eventEntity) return;
    const [ entityKind ] = eventEntity;

    // create event type
    const eventType = new ChainEventType(
      `${chain}-${cwEvent.data.kind.toString()}`,
      chain,
      cwEvent.data.kind.toString()
    );

    // create event
    const event = new ChainEvent(cwEvent.blockNumber, cwEvent.data, eventType);

    // create entity
    const fieldName = entityToFieldName(entityKind);
    if (!fieldName) return;
    const fieldValue = event.data[fieldName];
    const entity = new ChainEntity(chain, entityKind, fieldValue.toString(), []);
    this.update(entity, event);
    return [ entity, event ];
  }

  public async subscribeEntities<Api, RawEvent>(
    chainAdapter: IChainAdapter<any, any>,
    fetcher: IStorageFetcher<Api>,
    subscriber: IEventSubscriber<Api, RawEvent>,
    processor: IEventProcessor<Api, RawEvent>,
  ) {
    const chain = chainAdapter.meta.chain.id;
    this._subscriber = subscriber;
    // get existing events
    const existingEvents = await fetcher.fetch();
    // eslint-disable-next-line no-restricted-syntax
    for (const cwEvent of existingEvents) {
      const result = this._handleCWEvent(chain, cwEvent);
      if (result) {
        const [ entity, event ] = result;
        chainAdapter.handleEntityUpdate(entity, event);
      }
    }

    // kick off subscription to future events
    // TODO: handle unsubscribing
    console.log('Subscribing to chain events.');
    subscriber.subscribe(async (block) => {
      const incomingEvents = await processor.process(block);
      // eslint-disable-next-line no-restricted-syntax
      for (const cwEvent of incomingEvents) {
        const result = this._handleCWEvent(chain, cwEvent);
        if (result) {
          const [ entity, event ] = result;
          chainAdapter.handleEntityUpdate(entity, event);
        }
      }
    });
  }
}

export default ChainEntityController;
