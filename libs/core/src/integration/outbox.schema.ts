import { Events, events, PG_INT } from '@hicommonwealth/schemas';
import { z } from 'zod';

export const BaseOutboxProperties = z.object({
  event_id: PG_INT.optional(),
  relayed: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const outboxEvents = Object.keys(events) as Events[];

export const Outbox = z.union(
  outboxEvents.map((event_name) =>
    z
      .object({
        event_name: z.literal(event_name),
        event_payload: events[event_name],
      })
      .merge(BaseOutboxProperties),
  ) as unknown as readonly [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]],
);
