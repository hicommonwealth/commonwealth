/**
 * Determines which chain entities each event affects and updates state accordingly.
 */
import WebSocket from 'ws';
import {
  IEventHandler,
  CWEvent,
  eventToEntity,
  entityToFieldName,
  EntityEventKind,
  IChainEntityKind,
  IChainEventData,
  SubstrateTypes,
} from '@commonwealth/chain-events';

import { factory, addPrefix } from '../../shared/logging';

export default class extends IEventHandler {
  public readonly name = 'Entity Archival';

  constructor(
    private readonly _models,
    private readonly _chain?: string,
    private readonly _wss?: WebSocket.Server
  ) {
    super();
  }

  // private async _wssSend(dbEntity, dbEvent) {
  //   if (!this._wss) return;
  //   const dbEventType = await dbEvent.getChainEventType();
  //   const payload: IWebsocketsPayload<any> = {
  //     event: WebsocketMessageType.ChainEntity,
  //     data: {
  //       object_id: dbEntity.id,
  //       chainEntity: dbEntity.toJSON(),
  //       chainEvent: dbEvent.toJSON(),
  //       chainEventType: dbEventType.toJSON(),
  //     },
  //   };
  //   try {
  //     this._wss.emit(WebsocketMessageType.ChainEntity, payload);
  //   } catch (e) {
  //     log.warn(
  //       `Failed to emit websocket event for entity ${dbEntity.type}:${dbEntity.type_id}`
  //     );
  //   }
  // }

  /**
   * Handles an existing ChainEvent by connecting it with an entity, and creating
   * threads as needed.
   *
   * `dbEvent` is the database entry corresponding to the `event`.
   */
  public async handle(event: CWEvent<IChainEventData>, dbEvent) {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const log = factory.getLogger(addPrefix(__filename, [event.network, event.chain]));

    // if chain is stored in the event then that will override the class property
    // (allows backwards compatibility between reduced memory consuming chain consumer/handlers and other scripts)
    const chain = event.chain || this._chain;
    if (!dbEvent) {
      log.trace('no db event found!');
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
    const createEntityFn = async (
      type: IChainEntityKind,
      type_id: string,
      author?,
      completed = false
    ) => {
      if (type === SubstrateTypes.EntityKind.DemocracyPreimage) {
        // we always mark preimages as "completed" -- we have no link between democracy proposals
        // and preimages in the database, so we want to always fetch them for archival purposes,
        // which requires marking them completed.
        completed = true;
      }
      const params = author
        ? { type: type.toString(), type_id, chain, author }
        : { type: type.toString(), type_id, chain };
      const [dbEntity, created] = await this._models.ChainEntity.findOrCreate({
        where: params,
        default: { completed },
      });
      if (created) {
        log.info(
          `Created db entity, ${type.toString()}: ${type_id}.`
        );
      } else {
        log.info(
          `Found duplicate db entity,  ${type.toString()}: ${type_id}.`
        );
      }

      if (dbEvent.entity_id !== dbEntity.id) {
        dbEvent.entity_id = dbEntity.id;
        await dbEvent.save();
        // await this._wssSend(dbEntity, dbEvent);
      } else {
        log.info(
          `Db Event is already linked to entity! Doing nothing.`
        );
      }

      // TODO: create thread?
      return dbEvent;
    };

    const updateEntityFn = async (
      type: IChainEntityKind,
      type_id: string,
      completed = false
    ) => {
      const dbEntity = await this._models.ChainEntity.findOne({
        where: {
          type: type.toString(),
          type_id,
          chain,
        },
      });
      if (!dbEntity) {
        log.error(
          `no relevant db entity found for ${type}: ${type_id}`
        );
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
      // await this._wssSend(dbEntity, dbEvent);

      return dbEvent;
    };

    const entity = eventToEntity(event.network, event.data.kind);
    if (!entity) {
      log.trace(
        `no archival action needed for event of kind ${event.data.kind.toString()}`
      );
      return dbEvent;
    }
    const [entityKind, updateType] = entity;
    const fieldName = entityToFieldName(event.network, entityKind);
    const fieldValue = event.data[fieldName].toString();
    const author = event.data['proposer'];
    switch (updateType) {
      case EntityEventKind.Create: {
        return createEntityFn(entityKind, fieldValue, author);
      }
      case EntityEventKind.Update:
      case EntityEventKind.Vote: {
        return updateEntityFn(entityKind, fieldValue);
      }
      case EntityEventKind.Complete: {
        return updateEntityFn(entityKind, fieldValue, true);
      }
      default: {
        return null;
      }
    }
  }
}
