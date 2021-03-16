/**
 * Generic handler that stores the event in the database.
 */
import { IEventHandler, CWEvent, IChainEventKind, SubstrateTypes } from '@commonwealth/chain-events';
import Sequelize from 'sequelize';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

const { Op } = Sequelize;
export default class extends IEventHandler {
  constructor(
    private readonly _models,
    private readonly _chain: string,
    private readonly _excludedEvents: IChainEventKind[] = [],
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

  private async _isEventSkipped(event: CWEvent): Promise<boolean> {
    if (this._excludedEvents.includes(event.data.kind)) return true;

    // if using includeAddresses, check against db to see if addresses exist
    // TODO: we can eliminate more addresses by searching for held subscriptions rather than
    //    addresses (see subscription.ts), but this is a good start.
    // NOTE: this is currently only used by staking events, but may be expanded in the future.
    //   DO NOT USE INCLUDE ADDRESSES FOR CHAIN ENTITY-RELATED EVENTS.
    if (event.includeAddresses) {
      const addressModels = await this._models.Address.findAll({
        where: {
          address: {
            // TODO: we need to ensure the chain prefixes are correct here
            [Op.in]: event.includeAddresses,
          },
          chain: this._chain,
        },
      });
      if (!addressModels?.length) return true;
    }

    // TODO: special logic for large transfer events even if addresses not found
    return false;
  }

  /**
   * Handles an event by creating a ChainEvent in the database.
   */
  public async handle(event: CWEvent) {
    event = this.truncateEvent(event);
    log.debug(`Received event: ${JSON.stringify(event, null, 2)}`);
    const isSkipped = await this._isEventSkipped(event);
    if (isSkipped) {
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
