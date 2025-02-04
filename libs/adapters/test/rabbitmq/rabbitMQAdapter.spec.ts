import type { ILogger } from '@hicommonwealth/core';
import {
  BrokerPublications,
  BrokerSubscriptions,
  EventContext,
  InvalidInput,
  Policy,
} from '@hicommonwealth/core';
import { Events, events } from '@hicommonwealth/schemas';
import { delay } from '@hicommonwealth/shared';
import chai from 'chai';
import { AckOrNack } from 'rascal';
import { afterAll, afterEach, beforeAll, describe, test } from 'vitest';
import { RabbitMQAdapter } from '../../src/rabbitmq/RabbitMQAdapter';
import { createRmqConfig } from '../../src/rabbitmq/createRmqConfig';

const expect = chai.expect;

const idInput = '123';
let idOutput: string | undefined;
const eventName: Events = 'SnapshotProposalCreated';

const inputs = {
  SnapshotProposalCreated: events.SnapshotProposalCreated,
};

function Snapshot(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      SnapshotProposalCreated: async ({ payload }) => {
        const { id } = payload;
        idOutput = id;
      },
    },
  };
}

describe('RabbitMQ', () => {
  let rmqAdapter: RabbitMQAdapter;

  beforeAll(() => {
    rmqAdapter = new RabbitMQAdapter(
      createRmqConfig({
        rabbitMqUri: 'amqp://127.0.0.1',
        map: [{ consumer: Snapshot }],
      }),
    );
  });

  describe('Before initialization', () => {
    test('Should fail to publish messages if not initialized', async () => {
      const res = await rmqAdapter.publish(BrokerPublications.MessageRelayer, {
        name: eventName,
        payload: {
          id: 'testing',
        },
      });
      expect(res).to.be.false;
    });

    test('Should fail to subscribe if not initialized', async () => {
      const res = await rmqAdapter.subscribe(Snapshot);
      expect(res).to.be.false;
    });
  });

  describe('Publishing', () => {
    beforeAll(async () => {
      await rmqAdapter.init();
    });

    afterAll(async () => {
      await rmqAdapter.dispose();
    });

    afterAll(async () => {
      await rmqAdapter.broker?.purge();
    });

    test('should return false if a publication cannot be found', async () => {
      const res = await rmqAdapter.publish(
        'Testing' as BrokerPublications,
        {
          name: 'Test',
          payload: {},
        } as unknown as EventContext<typeof eventName>,
      );
      expect(res).to.be.false;
    });

    test('should return false if the topic is not included in the current instance', async () => {
      const res = await rmqAdapter.publish(BrokerPublications.DiscordListener, {
        name: 'Test',
        payload: {},
      } as unknown as EventContext<typeof eventName>);
      expect(res).to.be.false;
    });

    test('should publish a valid event and return true', async () => {
      const res = await rmqAdapter.publish(BrokerPublications.MessageRelayer, {
        name: eventName,
        payload: {
          id: idInput,
        },
      });
      expect(res).to.be.true;
    });
  });

  describe('Subscribing', () => {
    beforeAll(async () => {
      await rmqAdapter.init();
    });

    afterAll(async () => {
      await rmqAdapter.dispose();
    });

    afterEach(async () => {
      console.log('After...');
      await rmqAdapter.broker?.unsubscribeAll();
      console.log('Unsubscribed from all');
      await rmqAdapter.broker?.purge();
      console.log('Purged all queues');
    });

    test('should return false if the subscription cannot be found', async () => {
      const res = await rmqAdapter.subscribe(Snapshot);
      expect(res).to.be.false;
    });

    test(
      'should successfully subscribe, return true, and process a message',
      { timeout: 20_000 },
      async () => {
        const subRes = await rmqAdapter.subscribe(Snapshot);
        expect(subRes).to.be.true;
        const pubRes = await rmqAdapter.publish(
          BrokerPublications.MessageRelayer,
          {
            name: eventName,
            payload: {
              id: idInput,
            },
          },
        );
        expect(pubRes).to.be.true;
        await delay(1000);

        expect(idOutput).to.equal(idInput);
      },
    );

    test(
      'should execute a retry strategy if the payload schema is invalid',
      { timeout: 5000 },
      async () => {
        let shouldNotExecute = true;
        const inputs = {
          SnapshotProposalCreated: events.SnapshotProposalCreated,
        };

        function FailingSnapshot(): Policy<typeof inputs> {
          return {
            inputs,
            body: {
              SnapshotProposalCreated: async () => {
                shouldNotExecute = false;
              },
            },
          };
        }

        let retryExecuted;
        const subRes = await rmqAdapter.subscribe(
          FailingSnapshot,
          (
            err: any,
            topic: BrokerSubscriptions | string,
            content: any,
            ackOrNackFn: AckOrNack,
            _log: ILogger,
          ) => {
            retryExecuted = err instanceof InvalidInput;
            ackOrNackFn();
          },
        );
        expect(subRes).to.be.true;
        const pubRes1 = await rmqAdapter.publish(
          BrokerPublications.MessageRelayer,
          {
            name: eventName,
            payload: {
              id: 1,
            } as any,
          },
        );
        expect(pubRes1).to.be.true;
        await delay(1000);
        expect(retryExecuted).to.be.true;
        expect(shouldNotExecute).to.be.true;
        const pubRes = await rmqAdapter.publish(
          BrokerPublications.MessageRelayer,
          {
            name: eventName,
            payload: {
              id: '1',
            } as any,
          },
        );
        await delay(1000);
        expect(pubRes).to.be.true;
        expect(shouldNotExecute).to.be.false;
      },
    );
  });
});
