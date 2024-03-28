import { schemas } from '@hicommonwealth/core';
import { OutboxAttributes } from '@hicommonwealth/model';

export const testOutboxEvents: OutboxAttributes[] = [
  {
    event_name: 'second' as schemas.EventNames,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event_payload: {} as any,
    created_at: new Date('2024-01-02T00:00:00.000Z'),
  },
  {
    event_name: 'third' as schemas.EventNames,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event_payload: {} as any,
    created_at: new Date('2024-01-03T00:00:00.000Z'),
  },
  {
    event_name: 'first' as schemas.EventNames,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event_payload: {} as any,
    created_at: new Date('2024-01-01T00:00:00.000Z'),
  },
];
