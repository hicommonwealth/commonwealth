import { delay, schemas } from '@hicommonwealth/core';
import { DB, tester } from '@hicommonwealth/model';
import { expect } from 'chai';
import { Client } from 'pg';
import { setupListener } from '../../../server/workers/messageRelayer/pgListener';
import { numUnrelayedEvents } from '../../../server/workers/messageRelayer/relayForever';

describe('pgListener', () => {
  let client: Client;
  let models: DB;

  before(async () => {
    const res = await import('@hicommonwealth/model');
    models = res['models'];
    await tester.bootstrap_testing(true);
    client = await setupListener();
  });

  afterEach('Clean outbox', async () => {
    await models.Outbox.truncate();
  });

  it('should send a NOTIF when event is inserted into the Outbox', async () => {
    expect(numUnrelayedEvents).to.equal(0);
    const events = await models.Outbox.findAll({
      where: {},
    });
    expect(events.length).to.equal(0);

    await models.Outbox.create({
      event_name: 'test' as schemas.EventNames,
      event_payload: {
        event_name: 'test',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });
    await delay(1000);
    expect(numUnrelayedEvents).to.equal(1);
  });

  it('should not send a NOTIF when relayed is updated in the Outbox', async () => {
    const event = await models.Outbox.create({
      event_name: 'test' as schemas.EventNames,
      event_payload: {
        event_name: 'test',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });
    await delay(1000);
    expect(numUnrelayedEvents).to.equal(2);

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
    await delay(1000);
    expect(numUnrelayedEvents).to.equal(2);
  });

  after('Close client', async () => {
    if (client) await client.end();
    await models.Outbox.truncate();
  });
}).timeout(10_000);
