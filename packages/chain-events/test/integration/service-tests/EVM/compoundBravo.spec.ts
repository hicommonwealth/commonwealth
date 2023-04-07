import { runSubscriberAsFunction } from '../../../../services/ChainSubscriber/chainSubscriber';
import { MockRabbitMqHandler } from '../../../../services/ChainEventsConsumer/ChainEventHandlers';
import { getRabbitMQConfig } from 'common-common/src/rabbitmq';
import {
  RascalPublications,
  RascalSubscriptions,
} from 'common-common/src/rabbitmq/types';
import { RABBITMQ_URI } from '../../../../services/config';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import { compoundGovernor } from '../../../../chain-testing/src/utils/governance/compoundGov';
import { ChainTesting } from '../../../../chain-testing/sdk/chainTesting';
import chai from 'chai';
import chaiHttp from 'chai-http';
import models from '../../../../services/database/database';
import { setupChainEventConsumer } from '../../../../services/ChainEventsConsumer/chainEventsConsumer';
import { Op, Sequelize } from 'sequelize';
import { eventMatch } from '../../../util';
import { createChainEventsApp } from '../../../../services/app/Server';

const { expect } = chai;
chai.use(chaiHttp);

// TODO: we can remove the delay if we simply delay for 0.5 seconds and check whether the listeners lastBlock is higher
// than the block at which the event was emitted. If it is then we know the listener failed so we can exit the test
// otherwise we keep looping -> set the mocha test timeout to a high ceiling so that if the listener block number is not
// updating the test will fail

// TODO: ensure that the lastBlockNumber in the listener is updated AFTER all events have been processed + published to the appropriate queues

describe('Integration tests for Compound Bravo', () => {
  const rmq = new MockRabbitMqHandler(
    getRabbitMQConfig(RABBITMQ_URI),
    RascalPublications.ChainEvents
  );

  // holds event data, so we can verify the integrity of the events across all services
  const events = {};
  // holds the relevant entity instance - used to ensure foreign keys are applied properly
  let relatedEntity;

  const contract = new compoundGovernor();
  const chain_id = 'ganache-fork-bravo';
  const chain = {
    id: chain_id,
    base: ChainBase.Ethereum,
    network: ChainNetwork.Compound,
    substrate_spec: null,
    contract_address: contract.contractAddress,
    verbose_logging: false,
    ChainNode: { id: 1, url: 'http://localhost:8545' },
  };
  const sdk = new ChainTesting('http://127.0.0.1:3000');
  let proposalId: string;

  // This function delays the execution of the test for the specified number of milliseconds
  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  before(async () => {
    // initialize the mock rabbitmq controller
    await rmq.init();
  });

  describe('Tests the Bravo event listener using the chain subscriber', () => {
    before(async () => {
      // set up the chain subscriber
      await runSubscriberAsFunction(rmq, null, null, chain);
    });

    it('Should capture proposal created events', async () => {
      // get votes before creating the proposal, so we can test voting further down
      await sdk.getVotingPower(1, '456000');

      const result = await sdk.createProposal(1);
      proposalId = result.proposalId;
      await delay(10000);

      events['proposal-created'] =
        rmq.queuedMessages[RascalSubscriptions.ChainEvents][0];

      // verify the event was created and appended to the correct queue
      expect(
        rmq.queuedMessages[RascalSubscriptions.ChainEvents].length
      ).to.equal(1, 'Event not captured');
      eventMatch(
        rmq.queuedMessages[RascalSubscriptions.ChainEvents][0],
        'proposal-created',
        chain_id,
        proposalId
      );
    });

    it('Should capture votes on the created proposal', async () => {
      await sdk.castVote(proposalId, 1, true);

      await delay(12000);

      events['vote-cast'] =
        rmq.queuedMessages[RascalSubscriptions.ChainEvents][1];

      // verify the event was created and appended to the correct queue
      expect(
        rmq.queuedMessages[RascalSubscriptions.ChainEvents].length
      ).to.equal(2);
      eventMatch(
        rmq.queuedMessages[RascalSubscriptions.ChainEvents][1],
        'vote-cast',
        chain_id,
        proposalId
      );
    });

    it('Should capture proposal queued events', async () => {
      await sdk.queueProposal(proposalId);

      await delay(12000);

      events['proposal-queued'] =
        rmq.queuedMessages[RascalSubscriptions.ChainEvents][2];

      // verify the event was created and appended to the correct queue
      expect(
        rmq.queuedMessages[RascalSubscriptions.ChainEvents].length
      ).to.equal(3);
      eventMatch(
        rmq.queuedMessages[RascalSubscriptions.ChainEvents][2],
        'proposal-queued',
        chain_id,
        proposalId
      );
    });

    it('Should capture proposal executed events', async () => {
      await sdk.executeProposal(proposalId);

      await delay(10000);

      events['proposal-executed'] =
        rmq.queuedMessages[RascalSubscriptions.ChainEvents][3];

      // verify the event was created and appended to the correct queue
      expect(
        rmq.queuedMessages[RascalSubscriptions.ChainEvents].length
      ).to.equal(4);
      eventMatch(
        rmq.queuedMessages[RascalSubscriptions.ChainEvents][3],
        'proposal-executed',
        chain_id,
        proposalId
      );
    });

    xit('Should capture proposal cancelled events', async () => {
      const proposalIdToCancel = await sdk.createProposal(1);
      await sdk.cancelProposal(proposalIdToCancel);

      await delay(10000);

      // verify the event was created and appended to the correct queue
      expect(
        rmq.queuedMessages[RascalSubscriptions.ChainEvents].length
      ).to.equal(7);
    });
  });

  describe('Tests for processing Bravo events with the consumer', async () => {
    before(async () => {
      // set up the chain consumer - this starts the subscriptions thus processing all existing events
      await setupChainEventConsumer(rmq);
    });

    it('Should process proposal created events', async () => {
      const propCreatedEvent = await models.ChainEvent.findOne({
        where: {
          chain: chain_id,
          event_data: {
            [Op.and]: [
              Sequelize.literal(`event_data->>'kind' = 'proposal-created'`),
            ],
          },
          block_number: events['proposal-created'].blockNumber,
        },
      });

      expect(propCreatedEvent, 'Proposal created event not found').to.exist;
      expect(
        rmq.queuedMessages[RascalSubscriptions.ChainEventNotificationsCUDMain]
          .length
      ).to.equal(2);
      eventMatch(
        rmq.queuedMessages[
          RascalSubscriptions.ChainEventNotificationsCUDMain
        ][0].event,
        'proposal-created',
        chain_id,
        proposalId
      );

      relatedEntity = await models.ChainEntity.findOne({
        where: {
          chain: chain_id,
          type_id: '0x' + parseInt(proposalId).toString(16),
          type: 'proposal',
        },
      });

      expect(relatedEntity, 'Entity created not found').to.exist;
      expect(relatedEntity.id, 'Incorrect entity id').to.equal(
        propCreatedEvent.entity_id
      );
    });

    it('Should process vote cast events', async () => {
      const voteCastEvent = await models.ChainEvent.findOne({
        where: {
          chain: chain_id,
          event_data: {
            [Op.and]: [Sequelize.literal(`event_data->>'kind' = 'vote-cast'`)],
          },
          block_number: events['vote-cast'].blockNumber,
        },
      });

      expect(voteCastEvent).to.exist;
      expect(relatedEntity.id).to.equal(voteCastEvent.entity_id);
    });

    it('Should process proposal queued events', async () => {
      const propQueuedEvent = await models.ChainEvent.findOne({
        where: {
          chain: chain_id,
          event_data: {
            [Op.and]: [
              Sequelize.literal(`event_data->>'kind' = 'proposal-queued'`),
            ],
          },
          block_number: events['proposal-queued'].blockNumber,
        },
      });

      expect(propQueuedEvent).to.exist;
      expect(relatedEntity.id).to.equal(propQueuedEvent.entity_id);
    });

    it('Should process proposal executed events', async () => {
      const propExecutedEvent = await models.ChainEvent.findOne({
        where: {
          chain: chain_id,
          event_data: {
            [Op.and]: [
              Sequelize.literal(`event_data->>'kind' = 'proposal-executed'`),
            ],
          },
          block_number: events['proposal-executed'].blockNumber,
        },
      });

      expect(propExecutedEvent).to.exist;
      expect(relatedEntity.id).to.equal(propExecutedEvent.entity_id);

      eventMatch(
        rmq.queuedMessages[
          RascalSubscriptions.ChainEventNotificationsCUDMain
        ][1].event,
        'proposal-executed',
        chain_id,
        proposalId
      );
    });
  });

  describe('Tests for retrieving Bravo events with the app', async () => {
    let agent, hexProposalId;

    before(async () => {
      // set up the app
      const app = await createChainEventsApp();
      agent = chai.request(app).keepOpen();
      hexProposalId = '0x' + parseInt(proposalId).toString(16);
    });

    after(async () => {
      agent.close();
    });

    it('Should retrieve the proposal created event and entity', async () => {
      let res = await agent.get(`/api/events?limit=10`);
      expect(res.status).to.equal(200);
      expect(
        res.body.result,
        'The request body should contain an array of events'
      ).to.exist;

      const proposalCreatedEvent = res.body.result.find(
        (e) =>
          e.event_data.kind === 'proposal-created' &&
          e.event_data.id === hexProposalId &&
          e.chain === chain_id
      );
      expect(
        proposalCreatedEvent,
        'Should be set to the proposal creation event DB record'
      ).to.exist;

      res = await agent.get(
        `/api/entities?type=proposal&type_id=${hexProposalId}&chain=${chain_id}`
      );
      expect(res.status).to.equal(200);
      expect(
        res.body.result,
        'The request body should contain an array with a single element'
      ).to.exist;
      expect(res.body.result.length).to.equal(1);
      expect(res.body.result[0].id).to.equal(proposalCreatedEvent.entity_id);
    });

    it('Should retrieve vote cast events', async () => {
      const res = await agent.get(`/api/events?limit=10`);
      expect(res.status).to.equal(200);
      expect(res.body.result).to.exist;
      const event = res.body.result.find(
        (e) =>
          e.event_data.kind === 'vote-cast' &&
          e.event_data.id === hexProposalId &&
          e.chain === chain_id
      );
      expect(event).to.exist;
      expect(event.entity_id).to.equal(relatedEntity.id);
    });

    it('Should retrieve proposal queued events', async () => {
      const res = await agent.get(`/api/events?limit=10`);
      expect(res.status).to.equal(200);
      expect(res.body.result).to.exist;
      const event = res.body.result.find(
        (e) =>
          e.event_data.kind === 'proposal-queued' &&
          e.event_data.id === hexProposalId &&
          e.chain === chain_id
      );
      expect(event).to.exist;
      expect(event.entity_id).to.equal(relatedEntity.id);
    });

    it('Should retrieve proposal executed events', async () => {
      const res = await agent.get(`/api/events?limit=10`);
      expect(res.status).to.equal(200);
      expect(res.body.result).to.exist;
      const event = res.body.result.find(
        (e) =>
          e.event_data.kind === 'proposal-executed' &&
          e.event_data.id === hexProposalId &&
          e.chain === chain_id
      );
      expect(event).to.exist;
      expect(event.entity_id).to.equal(relatedEntity.id);
    });
  });

  after(async () => {
    await rmq.shutdown();
    await models.ChainEvent.destroy({
      where: { chain: chain_id },
      logging: console.log,
    });
    await models.ChainEntity.destroy({
      where: { chain: chain_id },
      logging: console.log,
    });
    await models.sequelize.close();
  });
});
