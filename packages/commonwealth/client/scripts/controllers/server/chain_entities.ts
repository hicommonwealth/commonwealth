/* eslint-disable no-restricted-syntax */
import $ from "jquery";

import { ChainEntityStore } from "stores";
import { ChainBase, ChainNetwork } from "common-common/src/types";
import { ChainEntity, ChainEvent, ChainEventType, ChainInfo } from "models";
import app from "state";
import {
  CWEvent,
  entityToFieldName,
  eventToEntity,
  IChainEntityKind,
  IEventProcessor,
  IEventSubscriber,
  SubstrateTypes,
  SupportedNetwork
} from "chain-events/src";
import { notifyError } from "../app/notifications";
import proposalIdToEntity from "helpers/proposalIdToEntity";
import { getBaseUrl, ServiceUrls } from "helpers/getUrl";


export function chainToEventNetwork(c: ChainInfo): SupportedNetwork {
  if (c.base === ChainBase.Substrate) return SupportedNetwork.Substrate;
  if (c.network === ChainNetwork.ERC20) return SupportedNetwork.ERC20;
  if (c.network === ChainNetwork.ERC721) return SupportedNetwork.ERC721;
  if (c.network === ChainNetwork.Compound) return SupportedNetwork.Compound;
  if (c.network === ChainNetwork.Aave) return SupportedNetwork.Aave;
  if (c.network === ChainNetwork.Moloch) return SupportedNetwork.Moloch;
  throw new Error(`Invalid event chain: ${c.id}, on network ${c.network}, base ${c.base}`);
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

async function getFetch(url: string, queryParams?: {[key: string]: any}) {
  let queryUrl;
  if (queryParams) queryUrl = url + new URLSearchParams(queryParams);
  try {
    const response = await fetch(queryUrl || url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      referrerPolicy: 'strict-origin-when-cross-origin',
    })
    if (response.ok) return response.json();
    else console.error(response)
  } catch (e) {
    console.error(e);
  }
}

type EntityHandler = (entity: ChainEntity, event: ChainEvent) => void;

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

  public async refresh(chain: string) {
    const options: any = { chain };

    // TODO: do in parallel and consolidate when both return
    // load the chain-entity objects
    const entities = await getFetch(getBaseUrl(ServiceUrls.chainEvents), options);
    if (entities) {
      for (const entityJSON of entities) {
        const entity = ChainEntity.fromJSON(entityJSON);
        this._store.add(entity);
      }
    }

    // load the commonwealth chain-entity metadata and populate the existing
    // entities in the store with it
    const entityMetas = await getFetch(getBaseUrl());
    if (entityMetas) {
      for (const entityMetaJSON of entityMetas) {
        const entity = this._store.getById(entityMetaJSON.ce_id);
        if (entity) {
          entity.title = entityMetaJSON.title;
          entity.threadId = entityMetaJSON.thread_id;
        }
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
      this._handlers[type] = [ fn ];
    } else {
      this._handlers[type].push(fn);
    }
  }

  public clearEntityHandlers(): void {
    this._handlers = {};
  }

  public async _fetchTitle(chain_entity_id: number): Promise<any> {
    try {
      return $.get(`${app.serverUrl()}/fetchEntityTitle`, {
        chain_entity_id
      });
    } catch (e) {
      return { status: 'Failed' };
    }
  }

  private _handleEvents(chain: string, network: SupportedNetwork, events: CWEvent[]) {
    for (const cwEvent of events) {
      // immediately return if no entity involved, event unrelated to proposals/etc
      const eventEntity = eventToEntity(network, cwEvent.data.kind);
      // eslint-disable-next-line no-continue
      if (!eventEntity) continue;
      const [ entityKind ] = eventEntity;
      // create event type
      const eventType = new ChainEventType(
        `${chain}-${cwEvent.data.kind.toString()}`,
        chain,
        network,
        cwEvent.data.kind.toString()
      );

      // create event
      const event = new ChainEvent(cwEvent.blockNumber, cwEvent.data, eventType);

      // create entity
      const fieldName = entityToFieldName(network, entityKind);
      // eslint-disable-next-line no-continue
      if (!fieldName) continue;
      const fieldValue = event.data[fieldName];
      const author = event.data['proposer'];
      let entity = new ChainEntity({
        chain,
        type: entityKind,
        typeId: fieldValue.toString(),
        chainEvents: [],
        createdAt: null,
        updatedAt: null,
        id: null,
        threadId: null,
        threadTitle: null,
        title: null,
        author,
      });

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

  public async updateEntityTitle(uniqueIdentifier: string, title: string) {
    const chainEntity = proposalIdToEntity(app, app.activeChainId(), uniqueIdentifier);
    return $.ajax({
      url: `${app.serverUrl()}/updateChainEntityTitle`,
      type: 'POST',
      data: {
        'jwt': app.user.jwt,
        'chain_entity_id': chainEntity?.id,
        'title': title,
        'chain': app.activeChainId(),
      },
      success: (response) => {
        const entity = ChainEntity.fromJSON(response.result);
        this._store.remove(entity);
        this._store.add(entity);
        return entity;
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
    processor: IEventProcessor<Api, RawEvent>,
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
