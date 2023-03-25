import {
  runSubscriberAsFunction
} from "../../../services/ChainSubscriber/chainSubscriber";
import {MockRabbitMqHandler} from "../../../services/ChainEventsConsumer/ChainEventHandlers";
import {getRabbitMQConfig, RascalPublications, RascalSubscriptions} from "common-common/src/rabbitmq";
import {RABBITMQ_URI} from "../../../services/config";
import {ChainBase, ChainNetwork} from "common-common/src/types";
import {compoundGovernor} from "../../../chain-testing/src/utils/governance/compoundGov";
import {ChainTesting} from "../../../chain-testing/sdk/chainTesting";
import chai from 'chai';

const { expect } = chai;

describe('Integration tests for Compound Bravo', () => {
  const rmq = new MockRabbitMqHandler(getRabbitMQConfig(RABBITMQ_URI), RascalPublications.ChainEvents);
  const contract = new compoundGovernor();
  const chain = {
    id: 'ganache-fork',
    base: ChainBase.Ethereum,
    network: ChainNetwork.Compound,
    substrate_spec: null,
    contract_address: contract.contractAddress,
    verbose_logging: false,
    ChainNode: { id: 1, url: 'http://localhost:8545' }
  }
  const sdk = new ChainTesting('http://127.0.0.1:3000');
  let proposalId: string;

  // This function delays the execution of the test for the specified number of milliseconds
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  describe('Tests the Bravo event listener using the chain subscriber', () => {
    before(async () => {
      // initialize the mock rabbitmq controller
      await rmq.init();

      // set up the chain subscriber
      await runSubscriberAsFunction(rmq, null, null, chain);
    });

    it('Should capture proposal created events', async () => {
      proposalId = await sdk.createProposal(1);

      await delay(3000);

      // verify the event was created and appended to the correct queue
      console.log(rmq.queuedMessages[RascalSubscriptions.ChainEvents]);
      expect(rmq.queuedMessages[RascalSubscriptions.ChainEvents].length).to.equal(1);
    });

    it('Should capture votes on the created proposal', async () => {
      await sdk.castVote(proposalId, 1, false);

      await delay(3000);

      // verify the event was created and appended to the correct queue
      console.log(rmq.queuedMessages[RascalSubscriptions.ChainEvents]);
      expect(rmq.queuedMessages[RascalSubscriptions.ChainEvents].length).to.equal(2);
    });

    it('Should capture proposal executed events', async () => {
      await sdk.executeProposal(proposalId);

      await delay(3000);

      // verify the event was created and appended to the correct queue
      console.log(rmq.queuedMessages[RascalSubscriptions.ChainEvents]);
      expect(rmq.queuedMessages[RascalSubscriptions.ChainEvents].length).to.equal(3);
    });

    it('Should capture proposal cancelled events', async () => {
      const proposalIdToCancel = await sdk.createProposal(1);
      await sdk.cancelProposal(proposalIdToCancel);

      await delay(3000);

      // verify the event was created and appended to the correct queue
      console.log(rmq.queuedMessages[RascalSubscriptions.ChainEvents]);
      expect(rmq.queuedMessages[RascalSubscriptions.ChainEvents].length).to.equal(5);
    });

    it('Should capture proposal queued events', async () => {
      const proposalIdToQueue = await sdk.createProposal(1);
      await sdk.queueProposal(proposalIdToQueue);

      await delay(3000);
      // verify the event was created and appended to the correct queue
      console.log(rmq.queuedMessages[RascalSubscriptions.ChainEvents]);
      expect(rmq.queuedMessages[RascalSubscriptions.ChainEvents].length).to.equal(7);
    });
  })

  describe.skip('Tests for processing Bravo events with the consumer', async () => {});
  describe.skip('Tests for retrieving Bravo events with the app', async () => {})
})
