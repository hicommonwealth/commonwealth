/**
 * Determines which chain entities each event affects and updates state accordingly.
 */
import WebSocket from 'ws';
import { IEventHandler, CWEvent } from '../../../shared/events/interfaces';
import { SubstrateEventKind, SubstrateEntityKind } from '../../../shared/events/edgeware/types';
import { NotificationCategories, WebsocketMessageType, IWebsocketsPayload } from '../../../shared/types';

import { factory, formatFilename } from '../../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export default class extends IEventHandler {
  constructor(
    private readonly _models,
    private readonly _chain: string,
    private readonly _wss?: WebSocket.Server,
  ) {
    super();
  }

  public async wssSend(dbEntity, dbEvent) {
    if (!this._wss) return;
    const dbEventType = await dbEvent.getChainEventType();
    const payload: IWebsocketsPayload<any> = {
      event: WebsocketMessageType.ChainEntity,
      data: {
        object_id: dbEntity.id,
        chainEntity: dbEntity.toJSON(),
        chainEvent: dbEvent.toJSON(),
        chainEventType: dbEventType.toJSON(),
      }
    };
    try {
      this._wss.emit(WebsocketMessageType.ChainEntity, payload);
    } catch (e) {
      log.warn(`Failed to emit websocket event for entity ${dbEntity.type}:${dbEntity.type_id}`);
    }
  }

  /**
   * Handles an existing ChainEvent by connecting it with an entity, and creating
   * threads as needed.
   *
   * `dbEvent` is the database entry corresponding to the `event`.
   */
  public async handle(event: CWEvent, dbEvent) {
    if (!dbEvent) {
      log.error('no db event found!');
      return;
    }

    /* We expect to see 3 types of events:
     * 1. Entity creation events, "new proposal", e.g.
     * 2. Entity modification events, state changes and updates
     * 3. Events unrelated to entities (at least, ones we care about), like staking events
     *
     * We should determine, using the event's type, what action to take, based
     * on whether it is a creation, modification, or unrelated event.
     */
    const createEntityFn = async (type: SubstrateEntityKind, type_id: string, completed = false) => {
      const dbEntity = await this._models.ChainEntity.create({
        type: type.toString(), type_id, chain: this._chain, completed
      });
      log.info(`Created db entity, ${type.toString()}: ${type_id}.`);

      dbEvent.entity_id = dbEntity.id;
      await dbEvent.save();
      await this.wssSend(dbEntity, dbEvent);

      // TODO: create thread?
      return dbEvent;
    };

    const updateEntityFn = async (type: SubstrateEntityKind, type_id: string, completed = false) => {
      const dbEntity = await this._models.ChainEntity.findOne({
        where: {
          type: type.toString(), type_id, chain: this._chain
        }
      });
      if (!dbEntity) {
        log.error(`no relevant db entity found for ${type}: ${type_id}`);
        return;
      }
      log.info(`Updated db entity, ${type}: ${type_id}.`);

      // link ChainEvent to entity
      dbEvent.entity_id = dbEntity.id;
      await dbEvent.save();

      // update completed state if necessary
      if (!dbEntity.completed && completed) {
        dbEntity.completed = true;
        await dbEntity.save();
      }
      await this.wssSend(dbEntity, dbEvent);

      return dbEvent;
    };

    switch (event.data.kind) {
      // Democracy Proposal Events
      case SubstrateEventKind.DemocracyProposed: {
        const { proposalIndex } = event.data;
        return createEntityFn(SubstrateEntityKind.DemocracyProposal, proposalIndex.toString());
      }
      case SubstrateEventKind.DemocracyTabled: {
        const { proposalIndex } = event.data;
        return updateEntityFn(SubstrateEntityKind.DemocracyProposal, proposalIndex.toString(), true);
      }

      // Democracy Referendum Events
      case SubstrateEventKind.DemocracyStarted: {
        const { referendumIndex } = event.data;
        return createEntityFn(SubstrateEntityKind.DemocracyReferendum, referendumIndex.toString());
      }
      case SubstrateEventKind.DemocracyPassed: {
        const { referendumIndex } = event.data;
        return updateEntityFn(SubstrateEntityKind.DemocracyReferendum, referendumIndex.toString());
      }
      case SubstrateEventKind.DemocracyNotPassed:
      case SubstrateEventKind.DemocracyCancelled:
      case SubstrateEventKind.DemocracyExecuted: {
        const { referendumIndex } = event.data;
        return updateEntityFn(SubstrateEntityKind.DemocracyReferendum, referendumIndex.toString(), true);
      }

      // Preimage Events
      case SubstrateEventKind.PreimageNoted: {
        const { proposalHash } = event.data;
        // we always mark preimages as "completed" -- we have no link between democracy proposals
        // and preimages in the database, so we want to always fetch them for archival purposes,
        // which requires marking them completed.
        return createEntityFn(SubstrateEntityKind.DemocracyPreimage, proposalHash, true);
      }
      case SubstrateEventKind.PreimageUsed:
      case SubstrateEventKind.PreimageInvalid:
      case SubstrateEventKind.PreimageReaped: {
        const { proposalHash } = event.data;
        return updateEntityFn(SubstrateEntityKind.DemocracyPreimage, proposalHash, true);
      }

      // Treasury Events
      case SubstrateEventKind.TreasuryProposed: {
        const { proposalIndex } = event.data;
        return createEntityFn(SubstrateEntityKind.TreasuryProposal, proposalIndex.toString());
      }
      case SubstrateEventKind.TreasuryRejected:
      case SubstrateEventKind.TreasuryAwarded: {
        const { proposalIndex } = event.data;
        return updateEntityFn(SubstrateEntityKind.TreasuryProposal, proposalIndex.toString(), true);
      }

      // Elections Events -- no entities needed here given current spread of events,
      //   but if we add "candidacy" events, we may want entities for them

      // Collective Events
      //   Note we have no entity for "MemberExecuted", because that is a one-step
      //   operation involving no outside comment. We could make a separate entity
      //   type for it, if needed.
      case SubstrateEventKind.CollectiveProposed: {
        const { proposalHash } = event.data;
        return createEntityFn(SubstrateEntityKind.CollectiveProposal, proposalHash);
      }
      case SubstrateEventKind.CollectiveVoted:
      case SubstrateEventKind.CollectiveApproved: {
        const { proposalHash } = event.data;
        return updateEntityFn(SubstrateEntityKind.CollectiveProposal, proposalHash);
      }
      case SubstrateEventKind.CollectiveDisapproved:
      case SubstrateEventKind.CollectiveExecuted: {
        const { proposalHash } = event.data;
        return updateEntityFn(SubstrateEntityKind.CollectiveProposal, proposalHash, true);
      }

      // Signaling Events
      case SubstrateEventKind.SignalingNewProposal: {
        const { proposalHash } = event.data;
        return createEntityFn(SubstrateEntityKind.SignalingProposal, proposalHash);
      }
      case SubstrateEventKind.SignalingCommitStarted:
      case SubstrateEventKind.SignalingVotingStarted: {
        const { proposalHash } = event.data;
        return updateEntityFn(SubstrateEntityKind.SignalingProposal, proposalHash);
      }
      case SubstrateEventKind.SignalingVotingCompleted: {
        const { proposalHash } = event.data;
        return updateEntityFn(SubstrateEntityKind.SignalingProposal, proposalHash, true);
      }
      case SubstrateEventKind.Offence: {
        const { opaqueTimeSlot } = event.data;
        return updateEntityFn(SubstrateEntityKind.Offence, opaqueTimeSlot.toString(), true);
      }
      default: {
        log.trace(`no archival action needed for event of kind ${event.data.kind.toString()}`);
        return dbEvent;
      }
    }
  }
}
