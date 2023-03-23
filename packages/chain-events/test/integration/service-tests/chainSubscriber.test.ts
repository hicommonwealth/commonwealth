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

  describe('Tests the Bravo event listener using the chain subscriber', () => {
    before(async () => {
      // initialize the mock rabbitmq controller
      await rmq.init();

      // set up the chain subscriber
      await runSubscriberAsFunction(rmq, null, null, chain);
    });

    it('Should capture proposal created events', async () => {
      await sdk.createProposal(1);

      // verify the event was created and appended to the correct queue
      expect(rmq.queuedMessages[RascalSubscriptions.ChainEvents].length).to.equal(0);
    });

    it('Should capture votes on the created proposal');
    it('Should capture delegation events');
  })

  describe('Tests for processing Bravo events with the consumer', async () => {});
  describe('Tests for retrieving Bravo events with the app', async () => {})
})
