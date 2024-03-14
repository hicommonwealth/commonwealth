import * as events from './events.schemas';
export type Events = keyof typeof events;
export { events };

import * as entities from './entities.schemas';
export type Entities = keyof typeof entities;
export type Aggregates = Extract<
  Entities,
  'User' | 'Community' | 'Thread' | 'Comment' | 'Contract'
>;
export { entities };

export * as commands from './commands';
export * as queries from './queries';
