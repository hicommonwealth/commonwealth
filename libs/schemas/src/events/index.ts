import { z } from 'zod';
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

export { events };
