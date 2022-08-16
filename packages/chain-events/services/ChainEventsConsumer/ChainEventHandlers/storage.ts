/**
 * Generic handler that stores the event in the database.
 */
import {
  IEventHandler,
  CWEvent,
  IChainEventKind,
  SubstrateTypes,
} from 'chain-events/src';
import Sequelize from 'sequelize';
import { addPrefix, factory, formatFilename } from 'common-common/src/logging';
import { RabbitMQController } from 'common-common/src/rabbitmq/rabbitMQController';
import { RascalPublications } from 'common-common/src/rabbitmq/types';
import NodeCache from 'node-cache';
import crypto from 'crypto';

const log = factory.getLogger(formatFilename(__filename));

const { Op } = Sequelize;

export interface StorageFilterConfig {
  excludedEvents?: IChainEventKind[];
}

export default class extends IEventHandler {
  public readonly name = 'Storage'
  public readonly eventCache: NodeCache
  public readonly ttl = 20;

  constructor(
    private readonly _models,
    private readonly _chain?: string,
    private readonly _filterConfig: StorageFilterConfig = {},
    private readonly _rmqController?: RabbitMQController
  ) {
    super();
    this.eventCache = new NodeCache({
      stdTTL: this.ttl,
      deleteOnExpire: true,
      useClones: false
    });
  }

  /**
   * Truncates a preimage with large args into a smaller form, to decrease
   * storage size in the db and size of /bulkEntities fetches.
   */
  private truncateEvent(event: CWEvent, maxLength = 64): CWEvent {
    // only truncate preimages, for now
    if (event.data.kind === SubstrateTypes.EventKind.PreimageNoted && event.data.preimage) {
      event.data.preimage.args = event.data.preimage.args.map((m) => m.length > maxLength
        ? `${m.slice(0, maxLength - 1)}…`
        : m);
    }
    return event;
  }

  private async _shouldSkip(event: CWEvent): Promise<boolean> {
    const chain = event.chain || this._chain

    if (this._filterConfig.excludedEvents?.includes(event.data.kind)) return true;
    const addressesExist = async (addresses: string[]) => {
      const addressModels = await this._models.Address.findAll({
        where: {
          address: {
            // TODO: we need to ensure the chain prefixes are correct here
            [Op.in]: addresses,
          },
          chain,
        },
      });
      return !!addressModels?.length;
    };

    // if using includeAddresses, check against db to see if addresses exist
    // TODO: we can unify this with notifications.ts to save us some fetches and filter better
    // NOTE: this is currently only used by staking and transfer events.
    //   DO NOT USE INCLUDE ADDRESSES FOR CHAIN ENTITY-RELATED EVENTS.
    if (event.includeAddresses) {
      const shouldSend = await addressesExist(event.includeAddresses);
      if (!shouldSend) return true;
    }
    return false;
  }

  /**
   * Handles an event by creating a ChainEvent in the database.
   * NOTE: this may modify the event.
   */
  public async handle(event: CWEvent) {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const log = factory.getLogger(addPrefix(__filename, [event.network, event.chain]));
    const chain = event.chain || this._chain;

    event = this.truncateEvent(event);
    const shouldSkip = await this._shouldSkip(event);
    if (shouldSkip) {
      log.trace(`Skipping event!`);
      return;
    }

    // locate event type and add event (and event type if needed) to database
    const [ dbEventType, created ] = await this._models.ChainEventType.findOrCreate({
      where: {
        id: `${chain}-${event.data.kind.toString()}`,
        chain,
        event_network: event.network,
        event_name: event.data.kind.toString(),
      }
    });

    if (created) {
      this._rmqController.publish({chainEventTypeId: dbEventType.id}, RascalPublications.ChainEventTypeCUDMain);
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
    }

    // duplicate event check
    const eventKey = crypto.createHash('md5').update(JSON.stringify(eventData)).digest('hex');
    const cachedEvent = this.eventCache.get(eventKey);

    if (!cachedEvent) {
      const dbEvent = await this._models.ChainEvent.create(eventData);
      this.eventCache.set(eventKey, eventData);

      return dbEvent;
    } else {
      // refresh ttl for the duplicated event
      this.eventCache.ttl(eventKey, this.ttl)
      // return nothing so following handlers ignore this event
    }
  }
}
