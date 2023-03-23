/* eslint-disable no-restricted-syntax */
import type {
  CWEvent,
  IChainEntityKind,
  IEventProcessor,
  IEventSubscriber,
} from 'chain-events/src';
import {
  eventToEntity,
  getUniqueEntityKey,
  SupportedNetwork,
} from 'chain-events/src';
import { SubstrateTypes } from 'chain-events/src/types';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import getFetch from 'helpers/getFetch';
import $ from 'jquery';
import type { ChainInfo } from 'models';
import { ChainEntity, ChainEvent, ChainEventType } from 'models';
import app from 'state';

import { ChainEntityStore } from 'stores';
import { notifyError } from '../app/notifications';

export function chainToEventNetwork(c: ChainInfo): SupportedNetwork {
  if (c.base === ChainBase.Substrate) return SupportedNetwork.Substrate;
  if (c.base === ChainBase.CosmosSDK) return SupportedNetwork.Cosmos;
  if (c.network === ChainNetwork.ERC20) return SupportedNetwork.ERC20;
  if (c.network === ChainNetwork.ERC721) return SupportedNetwork.ERC721;
  if (c.network === ChainNetwork.Compound) return SupportedNetwork.Compound;
  if (c.network === ChainNetwork.Aave) return SupportedNetwork.Aave;
  if (c.network === ChainNetwork.Moloch) return SupportedNetwork.Moloch;
  throw new Error(
    `Invalid event chain: ${c.id}, on network ${c.network}, base ${c.base}`
  );
}

// const get = (route, args, callback) => {
//   return $.get(app.serverUrl() + route, args)
//     .then((resp) => {
//       if (resp.status === 'Success') {
//         callback(resp.result);
//       } else {
//         console.error(resp);
//       }
//     })
//     .catch((e) => console.error(e));
// };

type EntityHandler = (entity: ChainEntity, event: ChainEvent) => void;

class ChainEntityController {
  private _store: ChainEntityStore = new ChainEntityStore();
  public get store() {
    return this._store;
  }

  private _subscriber: IEventSubscriber<any, any>;
  private _handlers: { [t: string]: EntityHandler[] } = {};

  public constructor() {
    // do nothing
  }

  public getPreimage(hash: string) {
    const preimage = this.store
      .getByType(SubstrateTypes.EntityKind.DemocracyPreimage)
      .find((preimageEntity) => {
        return (
          preimageEntity.typeId === hash &&
          preimageEntity.chainEvents.length > 0
        );
      });
    if (preimage) {
      const notedEvent = preimage.chainEvents.find(
        (event) => event.data.kind === SubstrateTypes.EventKind.PreimageNoted
      );
      if (notedEvent && notedEvent.data) {
        const result = (notedEvent.data as SubstrateTypes.IPreimageNoted)
          .preimage;
        return result;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  /**
   * Refreshes the raw chain entities from chain-events + ChainEntityMeta from the main service
   * to form full ChainEntities
   * @param chain
   */
  public async refresh(chain: string) {
    const options: any = { chain };

    // load the chain-entity objects
    const [entities, entityMetas] = await Promise.all([
      getFetch(`${app.serverUrl()}/ce/entities`, options),
      getFetch(`${app.serverUrl()}/getEntityMeta`, options),
    ]);

    if (Array.isArray(entities)) {
      // save the chain-entity objects in the store
      for (const entityJSON of entities) {
        const entity = ChainEntity.fromJSON(entityJSON);
        this._store.add(entity);
      }
    }

    // save chain-entity metadata to the appropriate chain-entity
    for (const entityMetaJSON of entityMetas) {
      const entity = this._store.getById(entityMetaJSON.ce_id);
      if (entity) {
        entity.title = entityMetaJSON.title;
        entity.threadId = entityMetaJSON.thread_id;
      }
    }
  }

  public async refreshRawEntities(chain: string) {
    const entities = await getFetch(`${app.serverUrl()}/ce/entities`, {
      chain,
    });
    if (Array.isArray(entities)) {
      for (const entityJSON of entities) {
        const entity = ChainEntity.fromJSON(entityJSON);
        this._store.add(entity);
      }
    }
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
      this._handlers[type] = [fn];
    } else {
      this._handlers[type].push(fn);
    }
  }

  public clearEntityHandlers(): void {
    this._handlers = {};
  }

  private _handleEvents(
    chain: string,
    network: SupportedNetwork,
    events: CWEvent[]
  ) {
    for (const cwEvent of events) {
      // immediately return if no entity involved, event unrelated to proposals/etc
      const eventEntity = eventToEntity(network, cwEvent.data.kind);
      // eslint-disable-next-line no-continue
      if (!eventEntity) continue;
      const [entityKind] = eventEntity;
      // create event type
      const eventType = new ChainEventType(
        `${chain}-${cwEvent.data.kind.toString()}`,
        chain,
        network,
        cwEvent.data.kind.toString()
      );

      // create event
      const event = new ChainEvent(
        cwEvent.blockNumber,
        cwEvent.data,
        eventType
      );

      // create entity
      const fieldName = getUniqueEntityKey(network, entityKind);
      // eslint-disable-next-line no-continue
      if (!fieldName) continue;
      const fieldValue = event.data[fieldName];

      const entity = this.store.getByUniqueData(
        chain,
        entityKind,
        fieldValue.toString()
      );
      if (!entity) {
        console.log(
          'Client creation of entities not supported. Please refresh to fetch new entities from the server.'
        );
        return;
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

  public async updateEntityTitle(uniqueIdentifier: string, title: string) {
    const chainEntity = this.store.getByUniqueId(
      app.activeChainId(),
      uniqueIdentifier
    );
    if (!chainEntity)
      console.error('Cannot update title for non-existent entity');
    return $.ajax({
      url: `${app.serverUrl()}/updateChainEntityTitle`,
      type: 'POST',
      data: {
        jwt: app.user.jwt,
        chain_entity_id: chainEntity.id,
        title,
        chain: app.activeChainId(),
      },
      success: () => {
        chainEntity.title = title;
      },
      error: (err) => {
        notifyError('Could not set entity title');
        console.error(err);
      },
    });
  }

  public async subscribeEntities<Api, RawEvent>(
    chain: string,
    network: SupportedNetwork,
    subscriber: IEventSubscriber<Api, RawEvent>,
    processor: IEventProcessor<Api, RawEvent>
  ): Promise<void> {
    this._subscriber = subscriber;

    // kick off subscription to future events
    // TODO: handle unsubscribing
    console.log('Subscribing to chain events.');
    subscriber.subscribe(async (block) => {
      const incomingEvents = await processor.process(block);
      this._handleEvents(chain, network, incomingEvents);
    });
  }
}

export default ChainEntityController;
