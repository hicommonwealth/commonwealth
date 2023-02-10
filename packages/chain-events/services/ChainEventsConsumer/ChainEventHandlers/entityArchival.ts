/**
 * Determines which chain entities each event affects and updates state accordingly.
 */

import { addPrefix, factory } from 'common-common/src/logging';
import type { RabbitMQController } from 'common-common/src/rabbitmq/rabbitMQController';
import type { RmqEntityCUD } from 'common-common/src/rabbitmq/types';
import { RascalPublications } from 'common-common/src/rabbitmq/types';

import type { DB } from '../../database/database';

import type { ChainEventInstance } from 'chain-events/services/database/models/chain_event';
import type {
  CWEvent,
  IChainEntityKind,
  IChainEventData,
} from 'chain-events/src';
import {
  EntityEventKind,
  eventToEntity,
  getUniqueEntityKey,
  IEventHandler,
} from 'chain-events/src';
import { SubstrateTypes } from 'chain-events/src/types';

export default class extends IEventHandler {
  public readonly name = 'Entity Archival';

  constructor(
    private readonly _models: DB,
    private readonly _rmqController: RabbitMQController,
    private readonly _chain?: string
  ) {
    super();
  }

  /**
   * Handles an existing ChainEvent by connecting it with an entity, and creating
   * threads as needed.
   *
   * `dbEvent` is the database entry corresponding to the `event`.
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public async handle(
    event: CWEvent<IChainEventData>,
    dbEvent: ChainEventInstance
  ) {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const log = factory.getLogger(
      addPrefix(__filename, [event.network, event.chain])
    );

    // if chain is stored in the event then that will override the class property
    // (allows backwards compatibility between reduced memory consuming chain consumer/handlers and other scripts)
    const chain = event.chain || this._chain;
    if (!dbEvent) {
      log.warn(
        `no db event found for event ${event.chain}::${event.data.kind}!`
      );
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
      author?: string,
      completed = false
    ) => {
      if (type === SubstrateTypes.EntityKind.DemocracyPreimage) {
        // we always mark preimages as "completed" -- we have no link between democracy proposals
        // and preimages in the database, so we want to always fetch them for archival purposes,
        // which requires marking them completed.
        completed = true;
      }

      const dbEntity = await this._models.ChainEntity.create({
        type: type.toString(),
        type_id,
        chain,
        author,
        completed,
      });

      const publishData: RmqEntityCUD.RmqMsgType = {
        ce_id: dbEntity.id,
        chain_id: dbEntity.chain,
        author,
        entity_type_id: type_id,
        cud: 'create',
      };

      await this._rmqController.safePublish(
        publishData,
        dbEntity.id,
        RascalPublications.ChainEntityCUDMain,
        {
          sequelize: this._models.sequelize,
          model: this._models.ChainEntity,
        }
      );

      if (dbEvent.entity_id !== dbEntity.id) {
        dbEvent.entity_id = dbEntity.id;
        await dbEvent.save();
      } else {
        log.info(`Db Event is already linked to entity! Doing nothing.`);
      }

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
    const fieldName = getUniqueEntityKey(event.network, entityKind);
    const fieldValue = event.data[fieldName].toString();
    const author = event.data['proposer'] || event.data['creator'];
    switch (updateType) {
      case EntityEventKind.Create: {
        await createEntityFn(entityKind, fieldValue, author);
        break;
      }
      case EntityEventKind.Update:
      case EntityEventKind.Vote: {
        await updateEntityFn(entityKind, fieldValue);
        break;
      }
      case EntityEventKind.Complete: {
        await updateEntityFn(entityKind, fieldValue, true);
        break;
      }
      default: {
        break;
      }
    }

    return dbEvent;
  }
}
