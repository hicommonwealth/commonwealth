import { z } from 'zod';
import * as chainEvents from './chain-event.schemas';
import { events } from './events.schemas';

export type EventSchemas = typeof events;
export type Events = keyof EventSchemas;
export type EventPair<K extends Events> = {
  event_name: K;
  event_payload: z.infer<EventSchemas[K]>;
};
export type EventPairs = {
  [K in Events]: EventPair<K>;
}[Events];

export { chainEvents, events };
