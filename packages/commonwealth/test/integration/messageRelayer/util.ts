import { OutboxAttributes } from '@hicommonwealth/model';

export const testOutboxEvents: OutboxAttributes[] = [
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event_name: 'second' as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event_payload: {} as any,
    created_at: new Date('2024-01-02T00:00:00.000Z'),
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event_name: 'third' as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event_payload: {} as any,
    created_at: new Date('2024-01-03T00:00:00.000Z'),
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event_name: 'first' as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event_payload: {} as any,
    created_at: new Date('2024-01-01T00:00:00.000Z'),
  },
];
