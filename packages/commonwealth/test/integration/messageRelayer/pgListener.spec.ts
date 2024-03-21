import { delay } from '@hicommonwealth/core';
import { tester } from '@hicommonwealth/model';
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
    eventId = parseInt(
      (
        await models.sequelize.query(
          `
        INSERT INTO "Outbox"(event_name, event_payload, relayed, created_at, updated_at) VALUES
          ('test', '{"test": 1}', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id;
      `,
          { raw: true },
        )
      )[0][0].id,
    );
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
