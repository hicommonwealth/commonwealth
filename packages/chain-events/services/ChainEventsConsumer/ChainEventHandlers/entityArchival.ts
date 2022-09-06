/**
 * Determines which chain entities each event affects and updates state accordingly.
 */
import {
  IEventHandler,
  CWEvent,
  eventToEntity,
  getUniqueEntityKey,
  EntityEventKind,
  IChainEntityKind,
  IChainEventData,
  SubstrateTypes,
} from 'chain-events/src';

import {factory, addPrefix} from 'common-common/src/logging';
import {RabbitMQController} from 'common-common/src/rabbitmq/rabbitMQController';
import {RascalPublications} from 'common-common/src/rabbitmq/types';

export default class extends IEventHandler {
  public readonly name = 'Entity Archival';

  constructor(
    private readonly _models,
    private readonly _chain?: string,
    private readonly _rmqController?: RabbitMQController
  ) {
    super();
  }

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
        ? {type: type.toString(), type_id, chain, author, completed}
        : {type: type.toString(), type_id, chain, completed};

      // TODO: update this to record the entity but use the ACK model to ensure consistency
      //      rather than a db transaction revert
      // insert the new entity into the database and publish the entity CUD message
      // if either one of these fails than the entire operation is reverted
      const dbEntity = await this._models.sequelize.transaction(async (t) => {
        const result = await this._models.ChainEntity.create({
          where: params,
        }, {transaction: t});

        await this._rmqController.publish({
          ce_id: result.id,
          chain_id: result.chain,
          cud: 'create'
        }, RascalPublications.ChainEntityCUDMain)

        return result;
      });


      if (dbEvent.entity_id !== dbEntity.id) {
        dbEvent.entity_id = dbEntity.id;
        await dbEvent.save();
      } else {
        log.info(
          `Db Event is already linked to entity! Doing nothing.`
        );
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
    const author = event.data['proposer'];
    let result;
    switch (updateType) {
      case EntityEventKind.Create: {
        result = await createEntityFn(entityKind, fieldValue, author);
        break;
      }
      case EntityEventKind.Update:
      case EntityEventKind.Vote: {
        result = await updateEntityFn(entityKind, fieldValue);
        break;
      }
      case EntityEventKind.Complete: {
        result = await updateEntityFn(entityKind, fieldValue, true);
        break;
      }
      default: {
        result = null;
        break;
      }
    }
  }
}
