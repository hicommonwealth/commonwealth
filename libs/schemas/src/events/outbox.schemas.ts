import { z } from 'zod';
import { PG_INT } from '../utils';
import { events } from './events.schemas';

export type EventSchemas = typeof events;
export type Events = keyof EventSchemas;

// TODO: clean list of events that should not be emitted to the outbox
export type OutboxSchemas = Omit<EventSchemas, 'ContestRolloverTimerTicked'>;
export type OutboxEvents = keyof OutboxSchemas;

export const outboxEvents = Object.keys(events).filter(
  (k) => k !== 'ContestRolloverTimerTicked',
) as OutboxEvents[];

export const Outbox = z.union(
  outboxEvents.map((event_name) =>
    z.object({
      event_id: PG_INT.optional(),
      event_name: z.literal(event_name),
      event_payload: events[event_name],
      relayed: z.boolean().optional(),
      created_at: z.coerce.date().optional(),
      updated_at: z.coerce.date().optional(),
    }),
  ) as unknown as readonly [z.ZodType, z.ZodType, ...z.ZodType[]],
);

export { events };
