import {
  BrokerTopics,
  delay,
  EventContext,
  Policy,
  schemas,
} from '@hicommonwealth/core';
import chai from 'chai';
import { RabbitMQAdapter } from '../../build';
import { getRabbitMQConfig, RascalConfigServices } from '../../src';

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

  before(async () => {
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

    after(async () => {
      await rmqAdapter.init();
    });
  });

  describe('Publishing', () => {
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

    it('should return false if the event schema is invalid', async () => {
      const res = await rmqAdapter.publish(BrokerTopics.SnapshotListener, {
        name: eventName,
        payload: {
          id: 10,
        },
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
      const res = await rmqAdapter.subscribe(
        BrokerTopics.SnapshotListener,
        Snapshot(),
      );
      expect(res).to.be.true;
      await delay(5000);

      expect(idOutput).to.equal(idInput);
    }).timeout(20000);
  });

  after(async () => {
    await rmqAdapter.dispose();
  });
});
