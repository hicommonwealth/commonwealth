/**
 * Generic handler that stores the event in the database.
 */
import { addPrefix, factory } from 'common-common/src/logging';
import type { RmqCETypeCUD } from 'common-common/src/rabbitmq';
import {
  AbstractRabbitMQController,
  RascalPublications,
} from 'common-common/src/rabbitmq';
import NodeCache from 'node-cache';
import hash from 'object-hash';
import { StatsDController } from 'common-common/src/statsd';

import type { DB } from '../../database/database';
import type { ChainEventInstance } from '../../database/models/chain_event';

import type { CWEvent, IChainEventKind } from 'chain-events/src';
import { IEventHandler } from 'chain-events/src';
import { SubstrateTypes } from 'chain-events/src/types';

export interface StorageFilterConfig {
  excludedEvents?: IChainEventKind[];
}

export default class extends IEventHandler {
  public readonly name = 'Storage';

  public readonly eventCache: NodeCache;

  public readonly ttl = 20;

  constructor(
    private readonly _models: DB,
    private readonly _rmqController: AbstractRabbitMQController,
    private readonly _chain?: string,
    private readonly _filterConfig: StorageFilterConfig = {}
  ) {
    super();
    this.eventCache = new NodeCache({
      stdTTL: this.ttl,
      deleteOnExpire: true,
      useClones: false,
    });
  }

  /**
   * Truncates a preimage with large args into a smaller form, to decrease
   * storage size in the db and size of /bulkEntities fetches.
   */
  private truncateEvent(event: CWEvent, maxLength = 64): CWEvent {
    // only truncate preimages, for now
    if (
      event.data.kind === SubstrateTypes.EventKind.PreimageNoted &&
      event.data.preimage
    ) {
      event.data.preimage.args = event.data.preimage.args.map((m) =>
        m.length > maxLength ? `${m.slice(0, maxLength - 1)}…` : m
      );
    }
    return event;
  }

  private async _shouldSkip(event: CWEvent): Promise<boolean> {
    return !!this._filterConfig.excludedEvents?.includes(event.data.kind);
  }

  /**
   * Handles an event by creating a ChainEvent in the database.
   * NOTE: this may modify the event.
   */
  public async handle(event: CWEvent): Promise<ChainEventInstance> {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const log = factory.getLogger(
      addPrefix(__filename, [event.network, event.chain])
    );
    const chain = event.chain || this._chain;

    event = this.truncateEvent(event);
    const shouldSkip = await this._shouldSkip(event);
    if (shouldSkip) {
      log.warn(`Skipping event!`);
      return;
    }

    // locate event type and add event (and event type if needed) to database
    const [dbEventType, created] =
      await this._models.ChainEventType.findOrCreate({
        where: {
          id: `${chain}-${event.data.kind.toString()}`,
          chain,
          event_network: event.network,
          event_name: event.data.kind.toString(),
        },
      });

    if (created) {
      const publishData: RmqCETypeCUD.RmqMsgType = {
        chainEventTypeId: dbEventType.id,
        cud: 'create',
      };

      await this._rmqController.safePublish(
        publishData,
        dbEventType.id,
        RascalPublications.ChainEventTypeCUDMain,
        {
          sequelize: this._models.sequelize,
          model: this._models.ChainEventType,
        }
      );

      log.info(`STORAGE HANDLER MESSAGE PUBLISHED`);
    }

    if (!dbEventType) {
      log.error(`unknown event type: ${event.data.kind}`);
      return;
    } else {
      if (created) {
        log.info(`Created new ChainEventType: ${dbEventType.id}`);
      } else {
        log.trace(`found chain event type: ${dbEventType.id}`);
      }
    }

    const eventData = {
      chain_event_type_id: dbEventType.id,
      block_number: event.blockNumber,
      event_data: event.data,
    };

    // duplicate event check
    const eventKey = hash(eventData, {
      respectType: false,
    });
    const cachedEvent = this.eventCache.get(eventKey);

    if (!cachedEvent) {
      const dbEvent = await this._models.ChainEvent.create(eventData);
      // populate chainEventType, so we don't need to re-populate it in subsequence handlers
      dbEvent.ChainEventType = dbEventType;
      // no need to save the entire event data since the key is the hash of the data
      this.eventCache.set(eventKey, true);

      const cacheStats = this.eventCache.getStats();
      StatsDController.get().gauge('ce.num-events-cached', cacheStats.keys);
      StatsDController.get().gauge('ce.event-cache-hits', cacheStats.hits);
      StatsDController.get().gauge('ce.event-cache-misses', cacheStats.misses);

      return dbEvent;
    } else {
      log.warn(`Duplicate event: ${eventKey}: ${JSON.stringify(eventData)}`);
      // refresh ttl for the duplicated event
      this.eventCache.ttl(eventKey, this.ttl);

      StatsDController.get().increment('ce.event-cache-chain-hit', { chain });

      const cacheStats = this.eventCache.getStats();
      StatsDController.get().gauge('ce.num-events-cached', cacheStats.keys);
      StatsDController.get().gauge('ce.event-cache-hits', cacheStats.hits);
      StatsDController.get().gauge('ce.event-cache-misses', cacheStats.misses);

      // return nothing so following handlers ignore this event
      return;
    }
  }
}
