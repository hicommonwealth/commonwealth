import { PinoLogger } from '@hicommonwealth/adapters';
import { delay, logger, schemas } from '@hicommonwealth/core';
import { OutboxInstance, tester } from '@hicommonwealth/model';
import { expect } from 'chai';
import { Client } from 'pg';
import { setupListener } from '../../../server/workers/messageRelayer/pgListener';
import { numUnrelayedEvents } from '../../../server/workers/messageRelayer/relayForever';

const log = logger(PinoLogger()).getLogger(__filename);

describe
  .only('pgListener', () => {
    let client: Client;
    let event: OutboxInstance;
    let models;
    before(async () => {
      const res = await import('@hicommonwealth/model');
      models = res['models'];
      await tester.seedDb();
      await models.Outbox.truncate();
    });

    it('should send a NOTIF when event is inserted into the Outbox', async () => {
      expect(numUnrelayedEvents).to.equal(0);
      const existingEvents = await models.Outbox.count({
        where: {
          relayed: false,
        },
      });
      expect(existingEvents).to.equal(0);
      client = await setupListener();
      await delay(5000);
      event = await models.Outbox.create(
        {
          event_name: schemas.EventNames.SnapshotProposalCreated,
          event_payload: {
            title: 'test',
            body: 'test',
            choices: ['yes', 'no'],
            space: 'test',
            event: 'test',
            start: 'test',
            expire: 'test',
            token: 'test',
            secret: 'test',
          },
          relayed: false,
        },
        { logging: console.log },
      );
      await delay(10000);
      expect(numUnrelayedEvents).to.equal(1);
    });

    it('should not send a NOTIF when relayed is updated in the Outbox', async () => {
      expect(numUnrelayedEvents).to.equal(1);
      await models.Outbox.update(
        {
          relayed: true,
        },
        {
          where: {
            id: event.id,
          },
        },
      );
      await delay(5000);
      expect(numUnrelayedEvents).to.equal(1);
    });

    after('Close client', async () => {
      await client.end();
      await models.Outbox.truncate();
    });
  })
  .timeout(10000_000);
