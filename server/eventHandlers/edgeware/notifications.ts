/**
 * Transforms raw edgeware events into notifications, and stores them in the db as ChainEvents.
 */
import WebSocket from 'ws';
import { IEventHandler, CWEvent } from '../../../shared/events/interfaces';
import { NotificationCategories } from '../../../shared/types';
import {
  eventToEntity, SubstrateEntityKind,
  ISubstrateDemocracyProposalEvents,
  ISubstrateDemocracyReferendumEvents,
  ISubstrateDemocracyPreimageEvents,
  ISubstrateTreasuryProposalEvents,
  ISubstrateCollectiveProposalEvents,
  ISubstrateSignalingProposalEvents,
} from '../../../shared/events/edgeware/types';

export default class extends IEventHandler {
  constructor(
    private readonly _models,
    private readonly _wss: WebSocket.Server,
    private readonly _chain: string,
  ) {
    super();
  }

  /**
   * Handles an event by creating a ChainEvent in the database, and emitting
   * notifications as needed.
   *
   * prevDbEvent will, for now, always be undefined, as it's a requirement of
   * event handlers that they take the previous handler's result, and this
   * is the first handler we run.
   *
   * If migrate is set to true, we will search for and upgrade pre-existing
   * events with new data corresponding to the upgraded data format. We will
   * also forgo emitting notifications to users, as it's a "run once" mode.
   */
  public async handle(event: CWEvent, prevDbEvent, migrate = false) {
    console.log(`Received event: ${JSON.stringify(event, null, 2)}`);
    // locate event type and add event to database
    const dbEventType = await this._models.ChainEventType.findOne({ where: {
      chain: this._chain,
      event_name: event.data.kind.toString(),
    } });
    if (!dbEventType) {
      console.error(`unknown event type: ${event.data.kind}`);
      return;
    } else {
      // console.log(`found chain event type: ${dbEventType.id}`);
    }

    // create event in db
    if (migrate) {
      return this._migrate(dbEventType, event);
    }
    const dbEvent = await this._models.ChainEvent.create({
      chain_event_type_id: dbEventType.id,
      block_number: event.blockNumber,
      event_data: event.data,
    });

    // console.log(`created db event: ${dbEvent.id}`);

    // locate subscriptions generate notifications as needed
    const dbNotifications = await this._models.Subscription.emitNotifications(
      this._models,
      NotificationCategories.ChainEvent,
      dbEventType.id,
      {
        created_at: new Date(),
      },
      { }, // TODO: add webhook data once specced out
      this._wss,
      event.excludeAddresses,
      event.includeAddresses,
      dbEvent.id,
    );
    console.log(`Emitted ${dbNotifications.length} notifications.`);
    return dbEvent;
  }

  /**
   * Find `event` in the database if it exists, and upgrade its data.
   * We do not expose a clear way of identifying events from the database
   * object alone, so we rely on looking at the stored JSON data to determine
   * equality.
   */
  private async _migrate(dbEventType, event: CWEvent) {
    // case by entity type to determine what value to look for
    const createOrUpdateModel = async (fieldName, fieldValue) => {
      const queryFieldName = `event_data.${fieldName}`;
      const existingEvent = await this._models.ChainEvent.findOne({ where: {
        chain_event_type_id: dbEventType.id,
        [queryFieldName]: fieldValue,
      } });
      if (existingEvent) {
        existingEvent.event_data = event.data;
        await existingEvent.save();
        console.log('Existing event found and migrated successfully!');
        return existingEvent;
      } else {
        console.log('No existing event found, creating new event in db!');
        return this._models.ChainEvent.create({
          chain_event_type_id: dbEventType.id,
          block_number: event.blockNumber,
          event_data: event.data,
        });
      }
    };

    const entityKind = eventToEntity(event.data.kind);
    if (entityKind === null) return null;
    switch (entityKind) {
      case SubstrateEntityKind.DemocracyProposal: {
        const proposalIndex = (event.data as ISubstrateDemocracyProposalEvents).proposalIndex;
        return createOrUpdateModel('proposalIndex', proposalIndex);
      }
      case SubstrateEntityKind.DemocracyReferendum: {
        const referendumIndex = (event.data as ISubstrateDemocracyReferendumEvents).referendumIndex;
        return createOrUpdateModel('referendumIndex', referendumIndex);
      }
      case SubstrateEntityKind.DemocracyPreimage: {
        const proposalHash = (event.data as ISubstrateDemocracyPreimageEvents).proposalHash;
        return createOrUpdateModel('proposalHash', proposalHash);
      }
      case SubstrateEntityKind.TreasuryProposal: {
        const proposalIndex = (event.data as ISubstrateTreasuryProposalEvents).proposalIndex;
        return createOrUpdateModel('proposalIndex', proposalIndex);
      }
      case SubstrateEntityKind.CollectiveProposal: {
        const proposalHash = (event.data as ISubstrateCollectiveProposalEvents).proposalHash;
        return createOrUpdateModel('proposalHash', proposalHash);
      }
      case SubstrateEntityKind.SignalingProposal: {
        const proposalHash = (event.data as ISubstrateSignalingProposalEvents).proposalHash;
        return createOrUpdateModel('proposalHash', proposalHash);
      }
      default: {
        return null;
      }
    }
  }
}
