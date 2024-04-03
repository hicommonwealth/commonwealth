import { delay } from '@hicommonwealth/core';
import {
  DB,
  insertOutbox,
  OutboxAttributes,
  tester,
} from '@hicommonwealth/model';
import { expect } from 'chai';
import { QueryTypes } from 'sequelize';
import { startMessageRelayer } from '../../../server/workers/messageRelayer/messageRelayer';
import { numUnrelayedEvents } from '../../../server/workers/messageRelayer/relayForever';
import { testOutboxEvents } from './util';

describe('messageRelayer', () => {
  let models: DB;

  before(async () => {
    const res = await import('@hicommonwealth/model');
    models = res['models'];
    await tester.seedDb();
    await models.sequelize.query('DELETE FROM "Outbox";');
  });

  afterEach('Clean outbox', async () => {
    await models.sequelize.query('DELETE FROM "Outbox";');
  });

  it('should relay existing events and new events', async () => {
    await insertOutbox(models, testOutboxEvents);
    // waits 200 ms between query by default -> 20 iterations = 6s
    await startMessageRelayer(30);
    await delay(1000);
    let events = await models.sequelize.query<OutboxAttributes>(
      `SELECT * FROM "Outbox" WHERE relayed = true;`,
      {
        type: QueryTypes.SELECT,
        raw: true,
      },
    );
    expect(numUnrelayedEvents).to.equal(0);
    expect(events.length).to.equal(3);
    await insertOutbox(models, testOutboxEvents);
    await delay(1000);
    events = await models.sequelize.query<OutboxAttributes>(
      `SELECT * FROM "Outbox" WHERE relayed = true;`,
      {
        type: QueryTypes.SELECT,
        raw: true,
      },
    );
    expect(events.length).to.equal(6);
    expect(numUnrelayedEvents).to.equal(0);
  });
}).timeout(10_000);
