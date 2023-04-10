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
import type { ProposalType } from 'common-common/src/types';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import getFetch from 'helpers/getFetch';
import type { ChainInfo } from 'models';
import { ChainEntity, ChainEvent } from 'models';
import { proposalSlugToChainEntityType } from '../../identifiers';
import app from 'state';

export function chainToEventNetwork(c: ChainInfo): SupportedNetwork {
  if (c.base === ChainBase.Substrate) return SupportedNetwork.Substrate;
  if (c.base === ChainBase.CosmosSDK) return SupportedNetwork.Cosmos;
  if (c.network === ChainNetwork.ERC20) return SupportedNetwork.ERC20;
  if (c.network === ChainNetwork.ERC721) return SupportedNetwork.ERC721;
  if (c.network === ChainNetwork.Compound) return SupportedNetwork.Compound;
  if (c.network === ChainNetwork.Aave) return SupportedNetwork.Aave;
  throw new Error(
    `Invalid event chain: ${c.id}, on network ${c.network}, base ${c.base}`
  );
}

type EntityHandler = (entity: ChainEntity, event: ChainEvent) => void;

class ChainEntityController {
  private _store: Map<string, ChainEntity[]> = new Map();

  public get store(): Map<string, ChainEntity[]> {
    return this._store;
  }

  private _subscriber: IEventSubscriber<any, any>;
  private _handlers: { [t: string]: EntityHandler[] } = {};

  public getByUniqueId(chain: string, uniqueId: string): ChainEntity {
    const [slug, type_id] = uniqueId.split('_');
    const type = proposalSlugToChainEntityType(<ProposalType>slug);

    return this._store
      .get(chain)
      .filter((e) => e.type === type && e.typeId === type_id)[0];
  }

  public getPreimage(hash: string) {
    const chainEntities: ChainEntity[] = Array.from(
      this._store.values()
    ).flat();
    const preimage = chainEntities.filter(
      (preimageEntity) =>
        preimageEntity.typeId === hash && preimageEntity.chainEvents.length > 0
    );

    if (preimage.length === 0) {
      return null;
    }

    const notedEvent = preimage[0].chainEvents.find(
      (event) => event.data.kind === SubstrateTypes.EventKind.PreimageNoted
    );

    if (notedEvent && notedEvent.data) {
      return (notedEvent.data as SubstrateTypes.IPreimageNoted).preimage;
    } else {
      return null;
    }
  }

  public getByType(type: IChainEntityKind): ChainEntity[] {
    return Array.from(this._store.values())
      .flat()
      .filter((e) => e.type === type);
  }

  /**
   * Refreshes the raw chain entities from chain-events + ChainEntityMeta from the main service
   * to form full ChainEntities
   * @param chain
   */
  public async refresh(chain: string): Promise<ChainEntity[]> {
    if (this._store.has(chain)) {
      return this._store.get(chain);
    }

    const options: any = { chain };

    // load the chain-entity objects
    const [entities, entityMetas] = await Promise.all([
      getFetch(`${app.serverUrl()}/ce/entities`, options),
      getFetch(`${app.serverUrl()}/getEntityMeta`, options),
    ]);

    const data = [];
    // save chain-entity metadata to the appropriate chain-entity
    const metaMap: Map<string, { title: string; threadId: number }> = new Map(
      entityMetas.map((e) => [
        e.ce_id,
        { title: e.title, threadId: e.thread_id },
      ])
    );

    if (Array.isArray(entities)) {
      // save the chain-entity objects in the store
      for (const entityJSON of entities) {
        const metaData = metaMap.get(entityJSON.id);
        if (metaData) {
          entityJSON.title = metaData.title;
          entityJSON.threadId = metaData.threadId;
        }

        const entity = ChainEntity.fromJSON(entityJSON);
        data.push(entity);
      }
    }

    this._store.set(chain, data);
    return data;
  }

  public async getRawEntities(chain: string): Promise<ChainEntity[]> {
    const entities = await getFetch(`${app.serverUrl()}/ce/entities`, {
      chain,
    });
    const data = [];
    if (Array.isArray(entities)) {
      for (const entityJSON of entities) {
        const entity = ChainEntity.fromJSON(entityJSON);
        data.push(entity);
      }
    }
    this._store.set(chain, data);
    return data;
  }

  public deinit() {
    this.clearEntityHandlers();
    this._store.clear();
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

      // create event
      const event = new ChainEvent(cwEvent.blockNumber, cwEvent.data);

      // create entity
      const fieldName = getUniqueEntityKey(network, entityKind);
      // eslint-disable-next-line no-continue
      if (!fieldName) continue;
      const fieldValue = event.data[fieldName];

      const entity = this._store
        .get(chain)
        .filter(
          (e) => e.type === entityKind && e.typeId === fieldValue.toString()
        )[0];

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
