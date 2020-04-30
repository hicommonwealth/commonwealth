/**
 * Transforms raw edgeware events into the final form for storage
 */
import WebSocket from 'ws';
import { IEventHandler, CWEvent } from '../../../shared/events/interfaces';
import { SubstrateEventKind, SubstrateEntityKind } from '../../../shared/events/edgeware/types';
import { NotificationCategories } from '../../../shared/types';

export default class extends IEventHandler {
  constructor(
    private readonly _models,
    private readonly _wss: WebSocket.Server,
    private readonly _chain: string,
  ) {
    super();
  }

  public wssSend(dbEntity, dbEvent) {
    if (!this._wss) return;
    const data = {
      event: 'server-event',
      topic: NotificationCategories.EntityEvent,
      object_id: dbEntity.id,
      chainEntity: dbEntity.toJSON(),
      chainEvent: dbEvent.toJSON(),
    };
    this._wss.emit('server-event', data);
  }

  /**
   * Handles an existing ChainEvent by connecting it with an entity, and creating
   * threads as needed.
   */
  public async handle(event: CWEvent, dbEvent) {
    if (!dbEvent) {
      console.error('no db event found!');
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
    const createEntityFn = async (type: SubstrateEntityKind, type_id: string) => {
      const dbEntity = await this._models.ChainEntity.create({
        type: type.toString(), type_id, chain: this._chain,
      });
      console.log(`Created db entity, ${type.toString()}: ${type_id}.`);

      dbEvent.entity_id = dbEntity.id;
      await dbEvent.save();
      this.wssSend(dbEntity, dbEvent);

      // TODO: create thread?
      return dbEntity;
    };

    const updateEntityFn = async (type: SubstrateEntityKind, type_id: string) => {
      const dbEntity = await this._models.ChainEntity.findOne({
        where: {
          type: type.toString(), type_id, chain: this._chain,
        }
      });
      if (!dbEntity) {
        console.error(`no relevant db entity found for ${type}: ${type_id}`);
        return;
      }
      console.log(`Updated db entity, ${type}: ${type_id}.`);

      // link ChainEvent to entity
      dbEvent.entity_id = dbEntity.id;
      await dbEvent.save();
      this.wssSend(dbEntity, dbEvent);

      return dbEntity;
    };

    switch (event.data.kind) {
      // TODO: we might need to do additional work for Democracy regarding preimages
      //    and generating titles for threads. But for now, preimages can be
      //    their own entity type.

      // Democracy Proposal Events
      case SubstrateEventKind.DemocracyProposed: {
        const { proposalIndex } = event.data;
        return createEntityFn(SubstrateEntityKind.DemocracyProposal, proposalIndex.toString());
      }
      case SubstrateEventKind.DemocracyTabled: {
        const { proposalIndex } = event.data;
        return updateEntityFn(SubstrateEntityKind.DemocracyProposal, proposalIndex.toString());
      }

      // Democracy Referendum Events
      case SubstrateEventKind.DemocracyStarted: {
        const { referendumIndex } = event.data;
        return createEntityFn(SubstrateEntityKind.DemocracyReferendum, referendumIndex.toString());
      }
      case SubstrateEventKind.DemocracyPassed:
      case SubstrateEventKind.DemocracyNotPassed:
      case SubstrateEventKind.DemocracyCancelled:
      case SubstrateEventKind.DemocracyExecuted: {
        const { referendumIndex } = event.data;
        return updateEntityFn(SubstrateEntityKind.DemocracyReferendum, referendumIndex.toString());
      }

      // Preimage Events
      case SubstrateEventKind.PreimageNoted: {
        const { proposalHash } = event.data;
        return createEntityFn(SubstrateEntityKind.DemocracyPreimage, proposalHash);
      }
      case SubstrateEventKind.PreimageUsed:
      case SubstrateEventKind.PreimageInvalid:
      case SubstrateEventKind.PreimageMissing:
      case SubstrateEventKind.PreimageReaped: {
        const { proposalHash } = event.data;
        return updateEntityFn(SubstrateEntityKind.DemocracyPreimage, proposalHash);
      }

      // Treasury Events
      case SubstrateEventKind.TreasuryProposed: {
        const { proposalIndex } = event.data;
        return createEntityFn(SubstrateEntityKind.TreasuryProposal, proposalIndex.toString());
      }
      case SubstrateEventKind.TreasuryRejected:
      case SubstrateEventKind.TreasuryAwarded: {
        const { proposalIndex } = event.data;
        return updateEntityFn(SubstrateEntityKind.TreasuryProposal, proposalIndex.toString());
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
      case SubstrateEventKind.CollectiveApproved:
      case SubstrateEventKind.CollectiveDisapproved:
      case SubstrateEventKind.CollectiveExecuted: {
        const { proposalHash } = event.data;
        return updateEntityFn(SubstrateEntityKind.CollectiveProposal, proposalHash);
      }

      // Signaling Events
      case SubstrateEventKind.SignalingNewProposal: {
        const { proposalHash } = event.data;
        return createEntityFn(SubstrateEntityKind.SignalingProposal, proposalHash);
      }
      case SubstrateEventKind.SignalingCommitStarted:
      case SubstrateEventKind.SignalingVotingStarted:
      case SubstrateEventKind.SignalingVotingCompleted: {
        const { proposalHash } = event.data;
        return updateEntityFn(SubstrateEntityKind.SignalingProposal, proposalHash);
      }

      default: {
        // console.log(`no archival action needed for event of kind ${event.data.kind.toString()}`);
      }
    }
  }
}
