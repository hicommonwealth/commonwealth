/* eslint-disable no-restricted-syntax */
import $ from 'jquery';
import _ from 'lodash';

import { ChainEntityStore } from 'stores';
import { ChainEntity, ChainEvent, ChainEventType } from 'models';
import app from 'state';
import {
  CWEvent,
  eventToEntity,
  entityToFieldName,
  IEventProcessor,
  IEventSubscriber,
  SubstrateTypes,
  IChainEntityKind,
} from '@commonwealth/chain-events';

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

type EntityHandler = (entity: ChainEntity, event: ChainEvent) => void

class ChainEntityController {
  private _store: ChainEntityStore = new ChainEntityStore();
  public get store() { return this._store; }
  private _subscriber: IEventSubscriber<any, any>;
  private _handlers: { [t: string]: EntityHandler[] } = {};

  public constructor() {
    // do nothing
  }

  public getPreimage(hash: string) {
    const preimage = this.store.getByType(SubstrateTypes.EntityKind.DemocracyPreimage)
      .find((preimageEntity) => {
        return preimageEntity.typeId === hash && preimageEntity.chainEvents.length > 0;
      });
    if (preimage) {
      const notedEvent = preimage.chainEvents.find(
        (event) => event.data.kind === SubstrateTypes.EventKind.PreimageNoted
      );
      if (notedEvent && notedEvent.data) {
        const result = (notedEvent.data as SubstrateTypes.IPreimageNoted).preimage;
        return result;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  public refresh(chain: string, refreshOption: EntityRefreshOption) {
    if (refreshOption === EntityRefreshOption.Nothing) return;
    const options: any = { chain };
    if (refreshOption === EntityRefreshOption.CompletedEntities) {
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
    this.clearEntityHandlers();
    this.store.clear();
    if (this._subscriber) {
      this._subscriber.unsubscribe();
      this._subscriber = undefined;
    }
  }

  public registerEntityHandler(type: IChainEntityKind, fn: EntityHandler) {
    if (!this._handlers[type]) {
      this._handlers[type] = [ fn ];
    } else {
      this._handlers[type].push(fn);
    }
  }

  public clearEntityHandlers(): void {
    this._handlers = {};
  }

  private _handleEvents(chain: string, events: CWEvent[]) {
    for (const cwEvent of events) {
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
      let entity = new ChainEntity(chain, entityKind, fieldValue.toString(), []);

      // update entity against store
      const existingEntity = this.store.get(entity);
      if (!existingEntity) {
        this._store.add(entity);
      } else {
        entity = existingEntity;
      }
      entity.addEvent(event);

      // emit update to handlers
      const handlers = this._handlers[entity.type];
      if (!handlers) {
        console.log(`No handler for entity type ${entity.type}, ignoring.`);
      } else {
        for (const handler of handlers) {
          handler(entity, event);
        }
      }
    }
  }

  public async fetchEntities<T extends CWEvent>(
    chain: string,
    fetch: () => Promise<T[]>,
    eventSortFn?: (a: CWEvent, b: CWEvent) => number,
  ): Promise<T[]> {
    // get existing events
    let existingEvents: T[];
    try {
      existingEvents = await fetch();
    } catch (e) {
      console.error(`Chain entity fetch failed: ${e.message}`);
      return;
    }
    if (eventSortFn) existingEvents.sort(eventSortFn);
    this._handleEvents(chain, existingEvents);
    return existingEvents;
  }

  public async subscribeEntities<Api, RawEvent>(
    chain: string,
    subscriber: IEventSubscriber<Api, RawEvent>,
    processor: IEventProcessor<Api, RawEvent>,
  ): Promise<void> {
    this._subscriber = subscriber;

    // kick off subscription to future events
    // TODO: handle unsubscribing
    console.log('Subscribing to chain events.');
    subscriber.subscribe(async (block) => {
      const incomingEvents = await processor.process(block);
      this._handleEvents(chain, incomingEvents);
    });
  }
}

export default ChainEntityController;
