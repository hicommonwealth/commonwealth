import { disposeAdapter } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { delay } from '@hicommonwealth/shared';
import { afterEach, describe, expect, test } from 'vitest';
import { startMessageRelayer } from '../../../server/workers/messageRelayer/messageRelayer';
import { testOutboxEvents } from './util';

describe('messageRelayer', { timeout: 20_000 }, () => {
  afterEach(async () => {
    await models.Outbox.truncate();
    disposeAdapter('brokerFactory');
  });

  test('should relay existing events and new events', async () => {
    await models.Outbox.bulkCreate(testOutboxEvents);
    // waits 200 ms between query by default -> 20 iterations = 6s
    await startMessageRelayer(2);
    await delay(1000);
    let events = await models.Outbox.findAll({
      where: {
        relayed: true,
      },
    });
    expect(events.length).to.equal(3);
    await models.Outbox.bulkCreate(testOutboxEvents);
    await delay(1000);
    events = await models.Outbox.findAll({
      where: {
        relayed: true,
      },
    });
    expect(events.length).to.equal(6);
  });
});
