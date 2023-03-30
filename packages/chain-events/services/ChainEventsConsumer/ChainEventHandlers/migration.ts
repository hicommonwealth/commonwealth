/**
 * Processes events during migration, upgrading from simple notifications to entities.
 */
import type { WhereOptions } from 'sequelize';
import type {
  RmqCENotificationCUD,
  RmqCETypeCUD,
} from 'common-common/src/rabbitmq';
import {AbstractRabbitMQController, RascalPublications} from 'common-common/src/rabbitmq';
import { factory, formatFilename } from 'common-common/src/logging';

import type { CWEvent } from '../../../src';
import {
  IEventHandler,
  eventToEntity,
  getUniqueEntityKey,
  EntityEventKind,
} from '../../../src';
import type { DB } from '../../database/database';
import type {
  ChainEventAttributes,
  ChainEventInstance,
} from '../../database/models/chain_event';
const log = factory.getLogger(formatFilename(__filename));

export default class extends IEventHandler<ChainEventInstance> {
  constructor(
    private readonly _models: DB,
    private readonly _rmqController: AbstractRabbitMQController,
    private readonly _chain?: string
  ) {
    super();
  }

  /**
   * Handles an event during the migration process, by creating or updating existing
   * events depending whether we've seen them before.
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public async handle(event: CWEvent) {
    const chain = event.chain || this._chain;

    // case by entity type to determine what value to look for
    const createOrUpdateModel = async (
      fieldName: string,
      fieldValue: string,
      eventType: EntityEventKind
    ) => {
      const [dbEventType, created] =
        await this._models.ChainEventType.findOrCreate({
          where: {
            id: `${chain}-${event.data.kind.toString()}`,
            chain,
            event_network: event.network,
            event_name: event.data.kind.toString(),
          },
        });
      log.trace(
        `${created ? 'created' : 'found'} chain event type: ${dbEventType.id}`
      );

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
      }

      const queryFieldName = `event_data.${fieldName}`;
      const queryArgs: WhereOptions<ChainEventAttributes> =
        eventType === EntityEventKind.Vote
          ? {
              chain_event_type_id: dbEventType.id,
              [queryFieldName]: fieldValue,
              // votes will be unique by data rather than by type
              event_data: event.data as any,
            }
          : {
              chain_event_type_id: dbEventType.id,
              [queryFieldName]: fieldValue,
            };
      const existingEvent = await this._models.ChainEvent.findOne({
        where: queryArgs,
      });
      if (existingEvent) {
        existingEvent.event_data = event.data;
        await existingEvent.save();
        log.info('Existing event found and migrated successfully!');
        return existingEvent;
      }

      log.info('No existing event found, creating new event in db!');
      const dbEvent = await this._models.ChainEvent.create({
        chain_event_type_id: dbEventType.id,
        block_number: event.blockNumber,
        event_data: event.data,
      });

      const formattedEvent: ChainEventAttributes = dbEvent.toJSON();
      formattedEvent.ChainEventType = dbEventType.toJSON();

      const publishData: RmqCENotificationCUD.RmqMsgType = {
        ChainEvent: formattedEvent,
        event,
        cud: 'create',
      };

      await this._rmqController.safePublish(
        publishData,
        dbEvent.id,
        RascalPublications.ChainEventNotificationsCUDMain,
        {
          sequelize: this._models.sequelize,
          model: this._models.ChainEvent,
        }
      );
      return dbEvent;
    };

    const entity = eventToEntity(event.network, event.data.kind);
    if (!entity) return null;
    const [entityKind, eventType] = entity;
    const fieldName = getUniqueEntityKey(event.network, entityKind);
    if (!fieldName) return null;
    const fieldValue = event.data[fieldName];
    return createOrUpdateModel(fieldName, fieldValue, eventType);
  }
}
