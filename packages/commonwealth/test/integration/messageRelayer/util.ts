import { EventContext, schemas } from '@hicommonwealth/core';

export const testOutboxEvents: (EventContext<schemas.Events> & {
  created_at?: Date;
})[] = [
  {
    name: 'second' as schemas.Events,
    payload: {},
    created_at: new Date('2024-01-02T00:00:00.000Z'),
  },
  {
    name: 'third' as schemas.Events,
    payload: {},
    created_at: new Date('2024-01-03T00:00:00.000Z'),
  },
  {
    name: 'first' as schemas.Events,
    payload: {},
    created_at: new Date('2024-01-01T00:00:00.000Z'),
  },
];
