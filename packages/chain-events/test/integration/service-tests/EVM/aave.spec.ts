import { runSubscriberAsFunction } from '../../../../services/ChainSubscriber/chainSubscriber';
import { MockRabbitMqHandler } from '../../../../services/ChainEventsConsumer/ChainEventHandlers';
import { getRabbitMQConfig } from 'common-common/src/rabbitmq';
import {
  RascalPublications,
  RascalSubscriptions,
} from 'common-common/src/rabbitmq/types';
import { RABBITMQ_URI } from '../../../../services/config';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import { aaveGovernor } from '../../../../chain-testing/src/utils/governance/aaveGov';
import { ChainTesting } from '../../../../chain-testing/sdk/chainTesting';
import chai from 'chai';
import chaiHttp from 'chai-http';
import models from '../../../../services/database/database';
import { setupChainEventConsumer } from '../../../../services/ChainEventsConsumer/chainEventsConsumer';
import { Op, Sequelize } from 'sequelize';
import {eventMatch, findEvent, getEvmSecondsAndBlocks} from '../../../util';
import { createChainEventsApp } from '../../../../services/app/Server';
import {EventKind} from "../../../../src/chains/aave/types";

const { expect } = chai;
chai.use(chaiHttp);

// TODO: we can remove the delay if we simply delay for 0.5 seconds and check whether the listeners lastBlock is higher
// than the block at which the event was emitted. If it is then we know the listener failed so we can exit the test
// otherwise we keep looping -> set the mocha test timeout to a high ceiling so that if the listener block number is not
// updating the test will fail

// TODO: ensure that the lastBlockNumber in the listener is updated AFTER all events have been processed + published to the appropriate queues

describe('Integration tests for Aave', () => {
  const rmq = new MockRabbitMqHandler(
    getRabbitMQConfig(RABBITMQ_URI),
    RascalPublications.ChainEvents
  );

  // holds event data, so we can verify the integrity of the events across all services
  const events = {};
  // holds the relevant entity instance - used to ensure foreign keys are applied properly
  let relatedEntity;

  const contract = new aaveGovernor();
  const chain_id = 'ganache-fork-aave';
  const chain = {
    id: chain_id,
    base: ChainBase.Ethereum,
    network: ChainNetwork.Aave,
    substrate_spec: null,
    contract_address: contract.contractAddress,
    verbose_logging: false,
    ChainNode: { id: 1, url: 'http://localhost:8545' },
  };
  const sdk = new ChainTesting('http://127.0.0.1:3000');
  let proposalId: string;
  let proposalCreatedBlockNum: number;

  // This function delays the execution of the test for the specified number of milliseconds
  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  before(async () => {
    // initialize the mock rabbitmq controller
    await rmq.init();
  });

  describe('Tests the Aave event listener using the chain subscriber', () => {
    before(async () => {
      // set up the chain subscriber
      await runSubscriberAsFunction(rmq, null, null, chain);
    });

    it('Should capture proposal created events', async () => {
      // get votes before creating the proposal, so we can test voting further down
      await sdk.getVotingPower(1, '400000', 'aave');

      const result = await sdk.createProposal(1, 'aave');
      proposalId = result.proposalId;
      proposalCreatedBlockNum = result.block;
      await delay(15000);

      console.log(JSON.stringify(rmq.queuedMessages, null, 2))
      events[EventKind.ProposalCreated] = findEvent(
        rmq.queuedMessages[RascalSubscriptions.ChainEvents],
        EventKind.ProposalCreated,
        chain_id,
        proposalCreatedBlockNum
      );

      eventMatch(
        events[EventKind.ProposalCreated],
        EventKind.ProposalCreated,
        chain_id,
        proposalId
      );
    });

    it('Should capture votes on the created proposal', async () => {
      const { secs, blocks } = getEvmSecondsAndBlocks(3);
      await sdk.advanceTime(String(secs), blocks)
      const { block } = await sdk.castVote(proposalId, 1, true, 'aave');

      await delay(20000);

      console.log(rmq.queuedMessages[RascalSubscriptions.ChainEvents]);
      events[EventKind.VoteEmitted] = findEvent(
        rmq.queuedMessages[RascalSubscriptions.ChainEvents],
        EventKind.VoteEmitted,
        chain_id,
        block
      );

      eventMatch(
        events[EventKind.VoteEmitted],
        EventKind.VoteEmitted,
        chain_id,
        proposalId
      );
    });

    it('Should capture proposal queued events', async () => {
      const { secs, blocks } = getEvmSecondsAndBlocks(3);
      await sdk.advanceTime(String(secs), blocks)
      const { block } = await sdk.queueProposal(proposalId, 'aave');

      await delay(12000);

      events[EventKind.ProposalQueued] = findEvent(
        rmq.queuedMessages[RascalSubscriptions.ChainEvents],
        EventKind.ProposalQueued,
        chain_id,
        block
      );

      eventMatch(
        events[EventKind.ProposalQueued],
        EventKind.ProposalQueued,
        chain_id,
        proposalId
      );
    });

    it('Should capture proposal executed events', async () => {
      const { secs, blocks } = getEvmSecondsAndBlocks(3);
      await sdk.advanceTime(String(secs), blocks)
      const { block } = await sdk.executeProposal(proposalId, 'aave');

      await delay(10000);

      events[EventKind.ProposalExecuted] = findEvent(
        rmq.queuedMessages[RascalSubscriptions.ChainEvents],
        EventKind.ProposalExecuted,
        chain_id,
        block
      );

      eventMatch(
        events[EventKind.ProposalExecuted],
        EventKind.ProposalExecuted,
        chain_id,
        proposalId
      );
    });

    xit('Should capture proposal cancelled events', async () => {
      const proposalIdToCancel = await sdk.createProposal(1, 'aave');
      await sdk.cancelProposal(proposalIdToCancel, 'aave');

      await delay(10000);

      // verify the event was created and appended to the correct queue
      expect(
        rmq.queuedMessages[RascalSubscriptions.ChainEvents].length
      ).to.equal(7);
    });
  });

  describe('Tests for processing Aave events with the consumer', async () => {
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
          block_number: events[EventKind.ProposalCreated].blockNumber,
        },
      });

      expect(propCreatedEvent, 'Proposal created event not found').to.exist;
      eventMatch(
        rmq.queuedMessages[
          RascalSubscriptions.ChainEventNotificationsCUDMain
        ][0].event,
        EventKind.ProposalCreated,
        chain_id,
        proposalId
      );

      relatedEntity = await models.ChainEntity.findOne({
        where: {
          chain: chain_id,
          type_id: proposalId,
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
            [Op.and]: [Sequelize.literal(`event_data->>'kind' = '${EventKind.VoteEmitted}'`)],
          },
          block_number: events[EventKind.VoteEmitted].blockNumber,
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
              Sequelize.literal(`event_data->>'kind' = '${EventKind.ProposalQueued}'`),
            ],
          },
          block_number: events[EventKind.ProposalQueued].blockNumber,
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
              Sequelize.literal(`event_data->>'kind' = '${EventKind.ProposalExecuted}'`),
            ],
          },
          block_number: events[EventKind.ProposalExecuted].blockNumber,
        },
      });

      expect(propExecutedEvent).to.exist;
      expect(relatedEntity.id).to.equal(propExecutedEvent.entity_id);

      eventMatch(
        rmq.queuedMessages[
          RascalSubscriptions.ChainEventNotificationsCUDMain
        ][1].event,
        EventKind.ProposalExecuted,
        chain_id,
        proposalId
      );
    });
  });

  describe('Tests for retrieving Aave events with the app', async () => {
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
      let res = await agent.get(`/api/events?limit=30`);
      expect(res.status).to.equal(200);
      expect(
        res.body.result,
        'The request body should contain an array of events'
      ).to.exist;

      console.log(res.body.result);
      const proposalCreatedEvent = res.body.result.find(
        (e) =>
          e.event_data.kind === EventKind.ProposalCreated &&
          e.event_data.id == proposalId &&
          e.chain === chain_id
      );
      expect(
        proposalCreatedEvent,
        'Should be set to the proposal creation event DB record'
      ).to.exist;

      res = await agent.get(
        `/api/entities?type=proposal&type_id=${proposalId}&chain=${chain_id}`
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
      const res = await agent.get(`/api/events?limit=30`);
      expect(res.status).to.equal(200);
      expect(res.body.result).to.exist;
      const event = res.body.result.find(
        (e) =>
          e.event_data.kind === EventKind.VoteEmitted &&
          e.event_data.id == proposalId &&
          e.chain === chain_id
      );
      expect(event).to.exist;
      expect(event.entity_id).to.equal(relatedEntity.id);
    });

    it('Should retrieve proposal queued events', async () => {
      const res = await agent.get(`/api/events?limit=30`);
      expect(res.status).to.equal(200);
      expect(res.body.result).to.exist;
      const event = res.body.result.find(
        (e) =>
          e.event_data.kind === EventKind.ProposalQueued &&
          e.event_data.id == proposalId &&
          e.chain === chain_id
      );
      expect(event).to.exist;
      expect(event.entity_id).to.equal(relatedEntity.id);
    });

    it('Should retrieve proposal executed events', async () => {
      const res = await agent.get(`/api/events?limit=30`);
      expect(res.status).to.equal(200);
      expect(res.body.result).to.exist;
      const event = res.body.result.find(
        (e) =>
          e.event_data.kind === EventKind.ProposalExecuted &&
          e.event_data.id == proposalId &&
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
