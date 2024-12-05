import { disposeAdapter } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { EventNames } from '@hicommonwealth/schemas';
import { delay } from '@hicommonwealth/shared';
import { expect } from 'chai';
import { afterEach, describe, test } from 'vitest';
import { startMessageRelayer } from '../../../server/workers/messageRelayer/messageRelayer';
import {
  numUnrelayedEvents,
  resetNumUnrelayedEvents,
} from '../../../server/workers/messageRelayer/relayForever';
import { testOutboxEvents } from './util';

describe('messageRelayer', { timeout: 20_000 }, () => {
  afterEach(async () => {
    await models.Outbox.truncate();
    disposeAdapter('brokerFactory');
  });

  test('should correctly increment number of unrelayed events on startup', async () => {
    await models.Outbox.bulkCreate([
      {
        event_name: EventNames.ChainEventCreated,
        event_payload: {
          event_name: EventNames.ChainEventCreated,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        relayed: true,
      },
      {
        event_name: EventNames.ChainEventCreated,
        event_payload: {
          event_name: EventNames.ChainEventCreated,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        relayed: false,
      },
      {
        event_name: EventNames.ChainEventCreated,
        event_payload: {
          event_name: EventNames.ChainEventCreated,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        relayed: false,
      },
    ]);

    const pgClient = await startMessageRelayer(-1);
    await pgClient.end();
    expect(numUnrelayedEvents).to.equal(2);
    resetNumUnrelayedEvents();
  });

  test('should relay existing events and new events', async () => {
    await models.Outbox.bulkCreate(testOutboxEvents);
    // waits 200 ms between query by default -> 20 iterations = 6s
    const pgClient = await startMessageRelayer(30);
    await delay(1000);
    let events = await models.Outbox.findAll({
      where: {
        relayed: true,
      },
    });
    expect(numUnrelayedEvents).to.equal(0);
    expect(events.length).to.equal(3);
    await models.Outbox.bulkCreate(testOutboxEvents);
    await delay(1000);
    events = await models.Outbox.findAll({
      where: {
        relayed: true,
      },
    });
    await pgClient.end();
    expect(events.length).to.equal(3);
    expect(numUnrelayedEvents).to.equal(0);
  });
});
