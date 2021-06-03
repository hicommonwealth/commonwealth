/**
 * Processes events during migration, upgrading from simple notifications to entities.
 */
import {
  IEventHandler, CWEvent, eventToEntity, entityToFieldName, IChainEventData, EventSupportingChainT, EntityEventKind
} from '@commonwealth/chain-events';
import _ from 'underscore';

import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export default class extends IEventHandler {
  constructor(
    private readonly _models,
    private readonly _chain: EventSupportingChainT,
  ) {
    super();
  }

  /**
   * Handles an event during the migration process, by creating or updating existing
   * events depending whether we've seen them before.
   */
  public async handle(event: CWEvent<IChainEventData>) {
    // case by entity type to determine what value to look for
    const createOrUpdateModel = async (fieldName: string, fieldValue: string, eventType: EntityEventKind) => {
      const [ dbEventType, created ] = await this._models.ChainEventType.findOrCreate({
        where: {
          id: `${this._chain}-${event.data.kind.toString()}`,
          chain: this._chain,
          event_name: event.data.kind.toString(),
        }
      });
      log.trace(`${created ? 'created' : 'found'} chain event type: ${dbEventType.id}`);
      const queryFieldName = `event_data.${fieldName}`;
      const queryArgs = eventType === EntityEventKind.Vote
        ? {
          chain_event_type_id: dbEventType.id,
          [queryFieldName]: fieldValue,
          // votes will be unique by data rather than by type
          event_data: event.data,
        } : {
          chain_event_type_id: dbEventType.id,
          [queryFieldName]: fieldValue,
        };
      const existingEvent = await this._models.ChainEvent.findOne({ where: queryArgs });
      if (!existingEvent) {
        log.trace('No existing event found, creating new event in db!');
        return this._models.ChainEvent.create({
          chain_event_type_id: dbEventType.id,
          block_number: event.blockNumber,
          event_data: event.data,
        });
      } else {
        existingEvent.event_data = event.data;
        await existingEvent.save();
        log.trace('Existing event found and migrated successfully!');
        return existingEvent;
      }
    };

    const entity = eventToEntity(this._chain, event.data.kind);
    if (!entity) return null;
    const [ entityKind, eventType ] = entity;
    const fieldName = entityToFieldName(this._chain, entityKind);
    if (!fieldName) return null;
    const fieldValue = event.data[fieldName];
    return createOrUpdateModel(fieldName, fieldValue, eventType);
  }
}
