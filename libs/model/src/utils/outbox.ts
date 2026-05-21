import { logger } from '@hicommonwealth/core';
import { EventPairs, OutboxEvents } from '@hicommonwealth/schemas';
import { Model, ModelStatic, Transaction } from 'sequelize';
import { config } from '../config';
import type { OutboxAttributes } from '../models/outbox';

const log = logger(import.meta);

const EventPriorities: Partial<Record<OutboxEvents, number>> = {
  CommunityJoined: -1,
  WalletLinked: -1,
  UserCreated: -1,
  SignUpFlowCompleted: -1,
  UserUpdated: -1,
};

/**
 * This functions takes either a new domain record or a pre-formatted event and inserts it into the Outbox. For core
 * domain events (e.g. new thread, new comment, etc.), the event_payload should be the complete domain record. The point
 * of this is that the emitter of a core domain event should never have to format the record itself. This
 * utility function centralizes event emission so that if any changes are required to the Outbox table or emission of
 * a specific event, this function can be updated without having to update the emitter code.
 */
export async function emitEvent(
  outbox: ModelStatic<Model<OutboxAttributes>>,
  values: Array<EventPairs>,
  transaction?: Transaction | null,
) {
  const records: Array<EventPairs> = [];
  for (const event of values) {
    if (!config.OUTBOX.BLACKLISTED_EVENTS.includes(event.event_name)) {
      records.push({
        ...event,
        priority:
          typeof event.priority === 'number'
            ? event.priority
            : (EventPriorities[event.event_name] ?? 0),
      });
    } else {
      log.warn(
        `Event not inserted into outbox! ` +
          `The event "${event.event_name}" is blacklisted.
          Remove it from BLACKLISTED_EVENTS env in order to allow emitting this event.`,
        {
          event_name: event.event_name,
          allowed_events: config.OUTBOX.BLACKLISTED_EVENTS,
        },
      );
    }
  }

  if (records.length > 0) {
    await outbox.bulkCreate(records, { transaction });
  }
}
