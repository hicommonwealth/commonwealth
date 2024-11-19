import { Events, Projection, events } from '@hicommonwealth/core';
import { ZodUndefined } from 'zod';

type EventSchemas = typeof events;

/**
 * Drains the outbox: Simulates the outbox being drained by the infrastructure and
 * pushing the events to a projection
 */
export async function drainOutbox<E extends Events>(
  events: E[],
  projection: Projection<{ [Name in E]: EventSchemas[Name] }, ZodUndefined>,
  from?: Date,
) {
  // TODO: implement this
  // loads events from outbox starting from ?? a minute ago
  // pushes events to projection
  // ignore errors??? this is for testing only
  console.log(events, projection, from);
}
