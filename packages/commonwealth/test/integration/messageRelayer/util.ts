import { schemas } from '@hicommonwealth/core';
import { InsertOutboxEvent } from '@hicommonwealth/model';

export const testOutboxEvents: [InsertOutboxEvent, ...InsertOutboxEvent[]] = [
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
