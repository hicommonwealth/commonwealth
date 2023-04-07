import chai from 'chai';
import {
  getRabbitMQConfig,
  RabbitMQController,
} from 'common-common/src/rabbitmq';
import {
  RascalExchanges,
  RascalQueues,
  RascalRoutingKeys,
  RmqCENotificationCUD,
  RmqEntityCUD
} from 'common-common/src/rabbitmq/types';
import type { ServiceConsumer } from 'common-common/src/serviceConsumer';
import {
  getQueueStats,
  getRmqMessage,
  publishRmqMsg,
} from 'common-common/src/rabbitmq/util';
import { v4 as uuidv4 } from 'uuid';
import { QueryTypes } from 'sequelize';

import { setupChainEventConsumer } from '../../../services/ChainEventsConsumer/chainEventsConsumer';
import type { CWEvent } from '../../../src';
import { SupportedNetwork } from '../../../src';
import type * as AaveTypes from '../../../src/chains/aave/types';
import type {
  IProposalCreated,
  ITransfer,
} from '../../../src/chains/aave/types';
import { EventKind } from '../../../src/chains/aave/types';
import models from '../../../services/database/database';
import { RABBITMQ_API_URI, RABBITMQ_URI } from '../../../services/config';
import { BrokerConfig } from 'rascal';

const { expect } = chai;

/*
NOTE: Handler errors will not appear in the test log. To see error/info logs about the consumer run the consumer in a
separate terminal with `yarn start-consumer` and run the test WITHOUT using the startConsumer function.

NOTE: Queues in this environment are automatically cleared everytime the ServiceConsumer is started
 */

async function startConsumer() {
  const rmqController = new RabbitMQController(
    <BrokerConfig>getRabbitMQConfig(RABBITMQ_URI)
  );
  await rmqController.init();
  return await setupChainEventConsumer(rmqController);
}

// TODO: tests only work using local or vultr rabbitmq due to Vhost in url
// TODO: change the waits to be conditional i.e. repeatedly hit API until condition is met or max wait is reached
describe('Tests for the ChainEventsConsumer service', () => {
  let serviceConsumer: ServiceConsumer;

  beforeEach(async () => {
    // const preQueueStats = await getQueueStats(
    //   RABBITMQ_API_URI,
    //   RascalQueues.ChainEvents
    // );
    // expect(preQueueStats.consumers).to.equal(
    //   0,
    //   'Ensure all other RabbitMQ connections are inactive'
    // );

    serviceConsumer = await startConsumer();

    // api refreshes every 5 seconds so ensure ample time is given
    // await new Promise(resolve => setTimeout(resolve, 10000));
  });

  afterEach(async () => {
    await serviceConsumer.shutdown();
    // api refreshes every 5 seconds so ensure ample time is given
    await new Promise((resolve) => setTimeout(resolve, 10000));
  });

  it.skip('Should consume from the chain-events queue', async () => {
    const postQueueStats = await getQueueStats(
      RABBITMQ_API_URI,
      RascalQueues.ChainEvents
    );

    expect(postQueueStats.consumers).to.equal(
      1,
      'The consumer did not properly connect to RabbitMQ'
    );
  });

  it('Should consume chain-event messages and store them in the database', async () => {
    const ceData: ITransfer = {
      kind: EventKind.Transfer,
      tokenAddress: uuidv4(),
      from: uuidv4(),
      to: uuidv4(),
      amount: uuidv4(),
    };
    // // create a fake aave-transfer event
    const chainEvent: CWEvent<AaveTypes.IEventData> = {
      blockNumber: Math.floor(Math.random() * 1000000),
      data: ceData,
      network: SupportedNetwork.Aave,
      chain: 'aave',
    };

    const publishJson = await publishRmqMsg(
      RABBITMQ_API_URI,
      RascalExchanges.ChainEvents,
      RascalRoutingKeys.ChainEvents,
      chainEvent
    );
    // ensure the event was properly published
    expect(publishJson.routed, 'Failed to publish test chain-event').to.be.true;

    // give time for the consumer to process the message
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // check whether consumer properly processed the event by checking the db for the new event
    const dbResult = await models.ChainEvent.findOne({
      where: {
        block_number: chainEvent.blockNumber,
        event_data: {
          kind: ceData.kind,
          tokenAddress: ceData.tokenAddress,
          from: ceData.from,
          to: ceData.to,
          amount: ceData.amount,
        },
      },
    });

    expect(dbResult).to.not.be.null;

    await models.ChainEvent.destroy({
      where: {
        block_number: chainEvent.blockNumber,
        event_data: {
          kind: chainEvent.data.kind,
          tokenAddress: ceData.tokenAddress,
          from: ceData.from,
          to: ceData.to,
          amount: ceData.amount,
        },
      },
    });
  });

  it('Should create new chain-event-types when discovered and push to the chain-entity queue', async () => {
    const chain = 'random-chain';

    const ceData: ITransfer = {
      kind: EventKind.Transfer,
      tokenAddress: uuidv4(),
      from: uuidv4(),
      to: uuidv4(),
      amount: uuidv4(),
    };
    // // create a fake aave-transfer event
    const chainEvent: CWEvent<AaveTypes.IEventData> = {
      blockNumber: Math.floor(Math.random() * 1000000),
      data: ceData,
      network: SupportedNetwork.Aave,
      chain,
    };

    const publishJson = await publishRmqMsg(
      RABBITMQ_API_URI,
      RascalExchanges.ChainEvents,
      RascalRoutingKeys.ChainEvents,
      chainEvent
    );
    // ensure the event was properly published
    expect(publishJson.routed, 'Failed to publish test chain-event').to.be.true;

    // give time for the consumer to process the message
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // check whether consumer properly processed the event by checking the db for the new event
    const dbResult = await models.ChainEvent.findOne({
      where: {
        block_number: chainEvent.blockNumber,
        event_data: {
          kind: ceData.kind,
          tokenAddress: ceData.tokenAddress,
          from: ceData.from,
          to: ceData.to,
          amount: ceData.amount,
        },
      },
    });

    expect(dbResult).to.not.be.null;

    await models.ChainEvent.destroy({
      where: {
        block_number: chainEvent.blockNumber,
        event_data: {
          kind: chainEvent.data.kind,
          tokenAddress: ceData.tokenAddress,
          from: ceData.from,
          to: ceData.to,
          amount: ceData.amount,
        },
      },
    });
  });

  it('Should push new chain-events to the chain-event notifications queue', async () => {
    const ceData: ITransfer = {
      kind: EventKind.Transfer,
      tokenAddress: uuidv4(),
      from: uuidv4(),
      to: uuidv4(),
      amount: uuidv4(),
    };
    // // create a fake aave-transfer event
    const chainEvent: CWEvent<AaveTypes.IEventData> = {
      blockNumber: Math.floor(Math.random() * 1000000),
      data: ceData,
      network: SupportedNetwork.Aave,
      chain: 'aave',
    };

    const publishJson = await publishRmqMsg(
      RABBITMQ_API_URI,
      RascalExchanges.ChainEvents,
      RascalRoutingKeys.ChainEvents,
      chainEvent
    );
    // ensure the event was properly published
    expect(publishJson.routed, 'Failed to publish test chain-event').to.be.true;

    // give time for the consumer to process the message
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // check whether consumer properly processed the event by checking the db for the new event
    const dbResult = await models.ChainEvent.findOne({
      where: {
        block_number: chainEvent.blockNumber,
        event_data: {
          kind: ceData.kind,
          tokenAddress: ceData.tokenAddress,
          from: ceData.from,
          to: ceData.to,
          amount: ceData.amount,
        },
      },
    });
    expect(dbResult).to.not.be.null;

    // check that a message was added to the chain-event notifications queue
    const message = await getRmqMessage(
      RABBITMQ_API_URI,
      RascalQueues.ChainEventNotificationsCUDMain,
      false
    );
    expect(message).to.have.property('length');
    expect(message.length).to.equal(1);
    expect(
      RmqCENotificationCUD.isValidMsgFormat(JSON.parse(message[0].payload)),
      'NotificationCUD has an invalid format'
    ).to.be.true;

    await models.ChainEvent.destroy({
      where: {
        block_number: chainEvent.blockNumber,
        event_data: {
          kind: chainEvent.data.kind,
          tokenAddress: ceData.tokenAddress,
          from: ceData.from,
          to: ceData.to,
          amount: ceData.amount,
        },
      },
    });
  });

  it('Should create an entity in the database and push to the entity cud queue', async () => {
    const max_proposal_id = (<any>(
      await models.sequelize.query(
        `
      SELECT MAX(("event_data" ->> 'id') :: int) as max_proposal_id
      FROM "ChainEvents"
      WHERE chain_event_type_id = 'aave-proposal-created';
  `,
        { raw: true, type: QueryTypes.SELECT }
      )
    )[0]).max_proposal_id;

    const ceData: IProposalCreated = {
      kind: EventKind.ProposalCreated,
      id: max_proposal_id + 1,
      proposer: uuidv4(),
      executor: uuidv4(),
      targets: [uuidv4()],
      values: [uuidv4()],
      signatures: [uuidv4()],
      calldatas: [uuidv4()],
      startBlock: Math.floor(Math.random() * 1000000),
      endBlock: Math.floor(Math.random() * 1000000),
      strategy: 'some-strategy',
      ipfsHash: 'yee haw',
    };
    // // create a fake aave-transfer event
    const chainEvent: CWEvent<AaveTypes.IEventData> = {
      blockNumber: Math.floor(Math.random() * 1000000),
      data: ceData,
      network: SupportedNetwork.Aave,
      chain: 'aave',
    };

    const publishJson = await publishRmqMsg(
      RABBITMQ_API_URI,
      RascalExchanges.ChainEvents,
      RascalRoutingKeys.ChainEvents,
      chainEvent
    );
    // ensure the event was properly published
    expect(publishJson.routed, 'Failed to publish test chain-event').to.be.true;

    // give time for the consumer to process the message
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // check whether consumer properly processed the event by checking the db for the new event
    const ceResult = await models.ChainEvent.findOne({
      where: {
        block_number: chainEvent.blockNumber,
        event_data: {
          kind: ceData.kind,
          id: String(ceData.id),
          proposer: ceData.proposer,
        },
      },
    });
    expect(ceResult).to.not.be.null;

    // check whether a new chain-entity was created in the db
    const cetResult = await models.ChainEntity.findOne({
      where: {
        chain: chainEvent.chain,
        type: 'proposal',
        type_id: String(ceData.id),
      },
    });
    expect(cetResult).to.not.be.null;

    // check that a message was added to the chain-entity cud queue
    const message = await getRmqMessage(
      RABBITMQ_API_URI,
      RascalQueues.ChainEntityCUDMain,
      false
    );
    expect(message).to.have.property('length');
    expect(message.length).to.equal(1);
    expect(
      RmqEntityCUD.isValidMsgFormat(JSON.parse(message[0].payload)),
      'The message has an incorrect type'
    ).to.be.true;

    await models.ChainEvent.destroy({
      where: {
        block_number: chainEvent.blockNumber,
        event_data: {
          kind: ceData.kind,
          id: String(ceData.id),
          proposer: ceData.proposer,
        },
      },
    });

    await models.ChainEntity.destroy({
      where: {
        chain: chainEvent.chain,
        type: 'proposal',
        type_id: String(ceData.id),
      },
    });
  });

  it(
    'Should re-queue messages that have failed to queue less than 5 times - RepublishMessages'
  );
  it(
    'Should send messages to a dead letter queue when a message fails to be queued 5 times'
  );
});
