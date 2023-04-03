/**
 * Processes events during migration, upgrading from simple notifications to entities.
 */
import type { WhereOptions } from 'sequelize';
import {AbstractRabbitMQController} from 'common-common/src/rabbitmq';
import { factory, formatFilename } from 'common-common/src/logging';

import type { CWEvent } from '../../../src';
import {
  EntityEventKind,
  eventToEntity,
  getUniqueEntityKey,
  IEventHandler,
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
      const queryFieldName = `event_data.${fieldName}`;
      const queryArgs: WhereOptions<ChainEventAttributes> =
        eventType === EntityEventKind.Vote
          ? {
              [queryFieldName]: fieldValue,
              // votes will be unique by data rather than by type
              event_data: event.data as any,
              chain,
            }
          : {
              [queryFieldName]: fieldValue,
              chain,
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
      return await this._models.ChainEvent.create({
        block_number: event.blockNumber,
        event_data: event.data,
        network: event.network,
        chain,
      });
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
