import {
  BrokerTopics,
  delay,
  EventContext,
  InvalidInput,
  Policy,
  schemas,
} from '@hicommonwealth/core';
import chai from 'chai';
import { getRabbitMQConfig, RascalConfigServices } from '../../src';
import { RabbitMQAdapter } from '../../src/rabbitmq/RabbitMQAdapter';

const expect = chai.expect;

const idInput = '123';
let idOutput: string | undefined;
const eventName: schemas.Events = 'SnapshotProposalCreated';

const inputs = {
  SnapshotProposalCreated: schemas.events.SnapshotProposalCreated,
};

const Snapshot: Policy<typeof inputs> = () => ({
  inputs,
  body: {
    SnapshotProposalCreated: async ({ payload }) => {
      const { id } = payload;
      idOutput = id;
    },
  },
});

describe('RabbitMQ', () => {
  let rmqAdapter: RabbitMQAdapter;

  before(() => {
    rmqAdapter = new RabbitMQAdapter(
      getRabbitMQConfig(
        'amqp://127.0.0.1',
        RascalConfigServices.SnapshotService,
      ),
    );
  });

  describe('Before initialization', () => {
    it('Should fail to publish messages if not initialized', async () => {
      const res = await rmqAdapter.publish(BrokerTopics.SnapshotListener, {
        name: eventName,
        payload: {
          id: 'testing',
        },
      });
      expect(res).to.be.false;
    });

    it('Should fail to subscribe if not initialized', async () => {
      const res = await rmqAdapter.subscribe(
        BrokerTopics.SnapshotListener,
        Snapshot() as any,
      );
      expect(res).to.be.false;
    });
  });

  describe('Publishing', () => {
    before(async () => {
      await rmqAdapter.init();
    });

    after(async () => {
      await rmqAdapter.dispose();
    });

    it('should return false if a publication cannot be found', async () => {
      const res = await rmqAdapter.publish(
        'Testing' as BrokerTopics,
        {
          name: 'Test',
          payload: {},
        } as unknown as EventContext<typeof eventName>,
      );
      expect(res).to.be.false;
    });

    it('should return false if the topic is not included in the current instance', async () => {
      const res = await rmqAdapter.publish(BrokerTopics.DiscordListener, {
        name: 'Test',
        payload: {},
      } as unknown as EventContext<typeof eventName>);
      expect(res).to.be.false;
    });

    it('should publish a valid event and return true', async () => {
      const res = await rmqAdapter.publish(BrokerTopics.SnapshotListener, {
        name: eventName,
        payload: {
          id: idInput,
        },
      });
      expect(res).to.be.true;
    });
  });

  describe('Subscribing', () => {
    before(async () => {
      await rmqAdapter.init();
    });

    after(async () => {
      await rmqAdapter.dispose();
    });

    it('should return false if the subscription cannot be found', async () => {
      const res = await rmqAdapter.subscribe(
        'Testing' as BrokerTopics,
        Snapshot(),
      );
      expect(res).to.be.false;
    });

    it('should return false if the topic is not included in the current instance', async () => {
      const res = await rmqAdapter.subscribe(
        BrokerTopics.DiscordListener,
        Snapshot(),
      );
      expect(res).to.be.false;
    });

    it('should successfully subscribe, return true, and process a message', async () => {
      const subRes = await rmqAdapter.subscribe(
        BrokerTopics.SnapshotListener,
        Snapshot(),
      );
      expect(subRes).to.be.true;
      const pubRes = await rmqAdapter.publish(BrokerTopics.SnapshotListener, {
        name: eventName,
        payload: {
          id: idInput,
        },
      });
      expect(pubRes).to.be.true;
      await delay(2000);

      expect(idOutput).to.equal(idInput);
    }).timeout(20000);

    it('should execute a retry strategy if the payload schema is invalid', async () => {
      let shouldNotExecute = true;
      const inputs = {
        SnapshotProposalCreated: schemas.events.SnapshotProposalCreated,
      };

      const FailingSnapshot: Policy<typeof inputs> = () => ({
        inputs,
        body: {
          SnapshotProposalCreated: async () => {
            shouldNotExecute = false;
          },
        },
      });

      let retryExecuted = false;
      const subRes = await rmqAdapter.subscribe(
        BrokerTopics.SnapshotListener,
        FailingSnapshot(),
        (err: Error | undefined) => {
          console.log(err);
          if (err instanceof InvalidInput) {
            retryExecuted = true;
          }
        },
      );
      expect(subRes).to.be.true;
      const pubRes = await rmqAdapter.publish(BrokerTopics.SnapshotListener, {
        name: eventName,
        payload: {
          id: 1,
        } as any,
      });
      expect(pubRes).to.be.true;
      await delay(2000);
      expect(retryExecuted).to.be.true;
      expect(shouldNotExecute).to.be.true;
    });
  });
});
