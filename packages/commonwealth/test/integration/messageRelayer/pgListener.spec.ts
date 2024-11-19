import { models, tester } from '@hicommonwealth/model';
import { delay } from '@hicommonwealth/shared';

import { Client } from 'pg';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { setupListener } from '../../../server/workers/messageRelayer/pgListener';
import {
  numUnrelayedEvents,
  resetNumUnrelayedEvents,
} from '../../../server/workers/messageRelayer/relayForever';

describe.skip('pgListener', { timeout: 10_000 }, () => {
  let client: Client;

  beforeAll(async () => {
    await tester.bootstrap_testing(import.meta);
    client = await setupListener();
  });

  afterEach(async () => {
    resetNumUnrelayedEvents();
    await models.Outbox.truncate();
  });

  afterAll(async () => {
    if (client) await client.end();
    await models.Outbox.truncate();
  });

  test('should send a NOTIF when event is inserted into the Outbox', async () => {
    expect(numUnrelayedEvents).to.equal(0);
    const events = await models.Outbox.findAll({
      where: {},
    });
    expect(events.length).to.equal(0);

    await models.Outbox.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      event_name: 'test' as any,
      event_payload: {
        event_name: 'test',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });
    await delay(1000);
    expect(numUnrelayedEvents).to.equal(1);
  });

  test('should not send a NOTIF when relayed is updated in the Outbox', async () => {
    const event = await models.Outbox.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      event_name: 'test' as any,
      event_payload: {
        event_name: 'test',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });
    await delay(5000);
    expect(numUnrelayedEvents).to.equal(1);

    await models.Outbox.update(
      {
        relayed: true,
      },
      {
        where: {
          relayed: false,
          event_id: event.event_id,
        },
      },
    );
    await delay(5000);
    expect(numUnrelayedEvents).to.equal(1);
  });
});
