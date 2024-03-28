import { delay, schemas } from '@hicommonwealth/core';
import { insertOutbox, tester } from '@hicommonwealth/model';
import { expect } from 'chai';
import { Client } from 'pg';
import { QueryTypes } from 'sequelize';
import { setupListener } from '../../../server/workers/messageRelayer/pgListener';
import { numUnrelayedEvents } from '../../../server/workers/messageRelayer/relayForever';

describe('pgListener', () => {
  let client: Client;
  let eventId: number;
  let models;
  before(async () => {
    const res = await import('@hicommonwealth/model');
    models = res['models'];
    await tester.seedDb();
    await models.sequelize.query('DELETE FROM "Outbox";');
  });

  it('should send a NOTIF when event is inserted into the Outbox', async () => {
    expect(numUnrelayedEvents).to.equal(0);
    const count = parseInt(
      (
        await models.sequelize.query(
          `
        SELECT COUNT(*) FROM "Outbox";
      `,
          { type: QueryTypes.SELECT, raw: true },
        )
      )[0].count,
    );
    expect(count).to.equal(0);
    client = await setupListener();
    eventId = (
      await insertOutbox(models, [
        {
          name: 'test' as schemas.Events,
          payload: {},
          created_at: new Date('2024-01-02T00:00:00.000Z'),
        },
      ])
    )[0];
    await delay(1000);
    expect(numUnrelayedEvents).to.equal(1);
  });

  it('should not send a NOTIF when relayed is updated in the Outbox', async () => {
    expect(numUnrelayedEvents).to.equal(1);
    await models.sequelize.query(
      `
        UPDATE "Outbox"
        SET relayed = true
        WHERE relayed = false AND id = ${eventId};
      `,
      { logging: console.log },
    );
    await delay(1000);
    expect(numUnrelayedEvents).to.equal(1);
  });

  after('Close client', async () => {
    if (client) await client.end();
    await models.sequelize.query('DELETE FROM "Outbox";');
  });
}).timeout(10_000);
