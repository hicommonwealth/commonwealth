/**
 * Generic handler that stores the event in the database.
 */
import { IEventHandler, CWEvent, IChainEventKind, SubstrateTypes } from '@commonwealth/chain-events';
import Sequelize from 'sequelize';
import BN from 'bn.js';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

const { Op } = Sequelize;

export interface StorageFilterConfig {
  transferSizeThreshold?: BN;
  excludedEvents?: IChainEventKind[];
}

export default class extends IEventHandler {
  constructor(
    private readonly _models,
    private readonly _chain: string,
    private readonly _filterConfig: StorageFilterConfig = {},
  ) {
    super();
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

  private async _filter(event: CWEvent): Promise<CWEvent> {
    if (this._filterConfig.excludedEvents?.includes(event.data.kind)) return null;
    const addressesExist = async (addresses: string[]) => {
      const addressModels = await this._models.Address.findAll({
        where: {
          address: {
            // TODO: we need to ensure the chain prefixes are correct here
            [Op.in]: addresses,
          },
          chain: this._chain,
        },
      });
      return !!addressModels?.length;
    };

    // if using includeAddresses, check against db to see if addresses exist
    // TODO: we can eliminate more addresses by searching for held subscriptions rather than
    //    addresses (see subscription.ts), but this is a good start.
    // NOTE: this is currently only used by staking events, but may be expanded in the future.
    //   DO NOT USE INCLUDE ADDRESSES FOR CHAIN ENTITY-RELATED EVENTS.
    if (event.includeAddresses) {
      const shouldSend = await addressesExist(event.includeAddresses);
      if (!shouldSend) return null;
    }

    // special logic for transfer events
    if (event.data.kind === SubstrateTypes.EventKind.BalanceTransfer) {
      // do not emit small transfers below threshold
      if (this._filterConfig.transferSizeThreshold !== undefined) {
        if (this._filterConfig.transferSizeThreshold.gt(new BN(event.data.value))) {
          return null;
        }
      }

      // if transfer is for registered addresses, emit event for them
      const addresses = [ event.data.sender, event.data.dest ];
      const shouldSend = await addressesExist(addresses);
      if (!shouldSend) return null;

      // modify include addresses so event only goes to them
      event.includeAddresses = addresses;
      return event;
    }
    return event;
  }

  /**
   * Handles an event by creating a ChainEvent in the database.
   */
  public async handle(event: CWEvent) {
    event = this.truncateEvent(event);
    log.debug(`Received event: ${JSON.stringify(event, null, 2)}`);
    event = await this._filter(event);
    if (!event) {
      log.trace('Skipping event!');
      return;
    }

    // locate event type and add event (and event type if needed) to database
    const [ dbEventType, created ] = await this._models.ChainEventType.findOrCreate({
      where: {
        id: `${this._chain}-${event.data.kind.toString()}`,
        chain: this._chain,
        event_name: event.data.kind.toString(),
      }
    });
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

    // create event in db
    const dbEvent = await this._models.ChainEvent.create({
      chain_event_type_id: dbEventType.id,
      block_number: event.blockNumber,
      event_data: event.data,
    });
    return dbEvent;
  }
}
