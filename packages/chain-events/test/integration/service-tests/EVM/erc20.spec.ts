import { MockRabbitMqHandler } from '../../../../services/ChainEventsConsumer/ChainEventHandlers';
import { getRabbitMQConfig } from 'common-common/src/rabbitmq';
import {
  RascalPublications,
  RascalSubscriptions,
} from 'common-common/src/rabbitmq/types';
import { RABBITMQ_URI } from '../../../../services/config';
import { compoundGovernor } from '../../../../chain-testing/src/utils/governance/compoundGov';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import { ChainTesting } from '../../../../chain-testing/sdk/chainTesting';
import { runSubscriberAsFunction } from '../../../../services/ChainSubscriber/chainSubscriber';
import chai from 'chai';
import chaiHttp from 'chai-http';
import {eventMatch, waitUntilBlock} from '../../../util';
import models from '../../../../services/database/database';
import { setupChainEventConsumer } from '../../../../services/ChainEventsConsumer/chainEventsConsumer';
import { Op, Sequelize } from 'sequelize';
import { createChainEventsApp } from '../../../../services/app/Server';
import Web3 from 'web3';
import {EventKind, IErc20Contracts} from "../../../../src/chains/erc20/types";
import {Processor, Subscriber} from "../../../../src/chains/erc20";
import { Listener } from "../../../../src";
import {IListenerInstances} from "../../../../services/ChainSubscriber/types";

const { expect } = chai;
chai.use(chaiHttp);

describe('Integration tests for ERC20', () => {
  const rmq = new MockRabbitMqHandler(
    getRabbitMQConfig(RABBITMQ_URI),
    RascalPublications.ChainEvents
  );

  // holds event data, so we can verify the integrity of the events across all services
  const events = {};
  // holds the relevant entity instance - used to ensure foreign keys are applied properly
  let relatedEntity;

  let listener: Listener<
    IErc20Contracts,
    never,
    Processor,
    Subscriber,
    EventKind
  >

  const contract = new compoundGovernor();
  const chain_id = 'ganache-fork-busd';
  const randomWallet = '0xD54f2E2173D0a5eA8e0862Aed18b270aFF08389e';
  const BUSDAddress = '0x4Fabb145d64652a948d72533023f6E7A623C7C53';
  const chain = {
    id: chain_id,
    base: ChainBase.Ethereum,
    network: ChainNetwork.ERC20,
    substrate_spec: null,
    contract_address: BUSDAddress,
    verbose_logging: false,
    ChainNode: { id: 1, url: 'http://localhost:8545' },
  };
  const sdk = new ChainTesting('http://127.0.0.1:3000');
  const transferAmount = '100';

  before(async () => {
    // initialize the mock rabbitmq controller
    await rmq.init();
  });

  describe('Tests the ERC20 event listener using the chain subscriber', async () => {
    before(async () => {
      // set up the chain subscriber
      const listeners: IListenerInstances = await runSubscriberAsFunction(rmq, null, null, chain);
      listener = listeners[`erc20_${chain.ChainNode.url}`] as Listener<
        IErc20Contracts,
        never,
        Processor,
        Subscriber,
        EventKind
      >
    });

    it('Should capture transfer events', async () => {
      const { block } = await sdk.getErc20(BUSDAddress, randomWallet, transferAmount);
      await waitUntilBlock(block, listener);

      const msg = rmq.queuedMessages[RascalSubscriptions.ChainEvents][0];
      events['transfer'] = msg;
      expect(
        rmq.queuedMessages[RascalSubscriptions.ChainEvents].length
      ).to.equal(1, 'Should have captured 1 transfer event');
      eventMatch(msg, 'transfer', chain_id, null, transferAmount);
    });

    it('Should capture approval events', async () => {
      const { block } = await sdk.approveErc20(
        BUSDAddress,
        randomWallet,
        Web3.utils.toWei(transferAmount)
      );
      await waitUntilBlock(block, listener);

      const msg = rmq.queuedMessages[RascalSubscriptions.ChainEvents][1];
      events['approval'] = msg;
      expect(
        rmq.queuedMessages[RascalSubscriptions.ChainEvents].length
      ).to.equal(2, 'Should have captured 1 approval event');
      eventMatch(msg, 'approval', chain_id, null, transferAmount);
    });
  });

  describe('Tests for processing ERC20 events with the consumer', async () => {
    before(async () => {
      // set up the chain consumer - this starts the subscriptions thus processing all existing events
      await setupChainEventConsumer(rmq);
    });

    it('Should process transfer events', async () => {
      const transferEvent = await models.ChainEvent.findOne({
        where: {
          chain: chain_id,
          event_data: {
            [Op.and]: [
              Sequelize.literal(`event_data->>'kind' = 'transfer'`),
              Sequelize.literal(
                `event_data->>'value' = '${Web3.utils.toWei(transferAmount)}'`
              ),
            ],
          },
          block_number: events['transfer'].blockNumber,
        },
      });
      expect(transferEvent, 'The transfer event should be in the database').to
        .exist;
    });

    it('Should process approval events', async () => {
      const approvalEvent = await models.ChainEvent.findOne({
        where: {
          chain: chain_id,
          event_data: {
            [Op.and]: [
              Sequelize.literal(`event_data->>'kind' = 'approval'`),
              Sequelize.literal(
                `event_data->>'value' = '${Web3.utils.toWei(transferAmount)}'`
              ),
            ],
          },
          block_number: events['approval'].blockNumber,
        },
      });
      expect(approvalEvent, 'The approval event should be in the database').to
        .exist;
    });
  });

  describe('Tests for retrieving ERC20 events with the app', () => {
    let agent;

    before(async () => {
      const app = await createChainEventsApp();
      agent = chai.request(app).keepOpen();
    });

    after(async () => {
      agent.close();
    });

    it('Should retrieve approve events', async () => {
      const res = await agent.get(`/api/events?limit=1`);
      expect(res.status).to.equal(200);
      expect(
        res.body.result,
        'The request body should contain an array of events'
      ).to.exist;
      expect(res.body.result[0].chain).to.equal(chain_id);
      expect(res.body.result[0].event_data.kind).to.equal('approval');
      expect(res.body.result[0].event_data.value).to.equal(
        Web3.utils.toWei(transferAmount)
      );
    });

    it('Should retrieve transfer events', async () => {
      const res = await agent.get(`/api/events?limit=2`);
      expect(res.status).to.equal(200);
      expect(
        res.body.result,
        'The request body should contain an array of events'
      ).to.exist;
      expect(res.body.result[1].chain).to.equal(chain_id);
      expect(res.body.result[1].event_data.kind).to.equal('transfer');
      expect(res.body.result[1].event_data.value).to.equal(
        Web3.utils.toWei(transferAmount)
      );
    });
  });

  after(async () => {
    await rmq.shutdown();
    await models.ChainEvent.destroy({
      where: { chain: chain_id }
    });
    await models.ChainEntity.destroy({
      where: { chain: chain_id }
    });
  });
});
