import { delay, schemas } from '@hicommonwealth/core';
import { DB, tester } from '@hicommonwealth/model';
import { expect } from 'chai';
import { startMessageRelayer } from '../../../server/workers/messageRelayer/messageRelayer';
import { numUnrelayedEvents } from '../../../server/workers/messageRelayer/relayForever';
import { testOutboxEvents } from './util';

describe('messageRelayer', () => {
  let models: DB;

  before(async () => {
    const res = await import('@hicommonwealth/model');
    models = res['models'];
    await tester.bootstrap_testing(true);
  });

  afterEach('Clean outbox', async () => {
    await models.Outbox.truncate();
  });

  it('should correctly increment number of unrelayed events on startup', async () => {
    await models.Outbox.bulkCreate([
      {
        event_name: schemas.EventNames.ChainEventCreated,
        event_payload: {
          event_name: schemas.EventNames.ChainEventCreated,
        },
        relayed: true,
      },
      {
        event_name: schemas.EventNames.ChainEventCreated,
        event_payload: {
          event_name: schemas.EventNames.ChainEventCreated,
        },
        relayed: false,
      },
      {
        event_name: schemas.EventNames.ChainEventCreated,
        event_payload: {
          event_name: schemas.EventNames.ChainEventCreated,
        },
        relayed: false,
      },
    ]);

    await startMessageRelayer(0);
    expect(numUnrelayedEvents).to.equal(2);
  });

  it('should relay existing events and new events', async () => {
    await models.Outbox.bulkCreate(testOutboxEvents);
    // waits 200 ms between query by default -> 20 iterations = 6s
    await startMessageRelayer(30);
    await delay(1000);
    let events = await models.Outbox.findAll({
      where: {
        relayed: true,
      },
    });
    expect(numUnrelayedEvents).to.equal(0);
    expect(events.length).to.equal(3);
    await models.Outbox.create(testOutboxEvents);
    await delay(1000);
    events = await models.Outbox.findAll({
      where: {
        relayed: true,
      },
    });
    expect(events.length).to.equal(6);
    expect(numUnrelayedEvents).to.equal(0);
  });
}).timeout(10_000);
