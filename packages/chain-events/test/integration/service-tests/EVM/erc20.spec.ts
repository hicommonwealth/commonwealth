import { MockRabbitMqHandler } from '../../../../services/ChainEventsConsumer/ChainEventHandlers';
import { getRabbitMQConfig } from 'common-common/src/rabbitmq';
import {
  RascalPublications,
  RascalSubscriptions,
} from 'common-common/src/rabbitmq/types';
import { RABBITMQ_URI } from '../../../../services/config';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import { ChainTesting } from '../../../../chain-testing/sdk/chainTesting';
import { runSubscriberAsFunction } from '../../../../services/ChainSubscriber/chainSubscriber';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { cwEventMatch, waitUntilBlock } from '../../../util';
import models from '../../../../services/database/database';
import { setupChainEventConsumer } from '../../../../services/ChainEventsConsumer/chainEventsConsumer';
import { Op, Sequelize } from 'sequelize';
import { createChainEventsApp } from '../../../../services/app/Server';
import Web3 from 'web3';
import {
  EventKind,
  IErc20Contracts,
} from '../../../../src/chain-bases/EVM/erc20/types';
import { Processor, Subscriber } from '../../../../src/chain-bases/EVM/erc20';
import { Listener, SupportedNetwork } from '../../../../src';
import { IListenerInstances } from '../../../../services/ChainSubscriber/types';
import { getErcListenerName } from 'chain-events/services/ChainSubscriber/util';

const { expect } = chai;
chai.use(chaiHttp);

describe.only('Integration tests for ERC20', () => {
  const rmq = new MockRabbitMqHandler(
    getRabbitMQConfig(RABBITMQ_URI),
    RascalPublications.ChainEvents
  );

  // holds event data, so we can verify the integrity of the events across all services
  const events = {};

  let listener: Listener<
    IErc20Contracts,
    never,
    Processor,
    Subscriber,
    EventKind
  >;

  const chainName = 'Ethereum (Ganache)';
  const randomWallet = '0xD54f2E2173D0a5eA8e0862Aed18b270aFF08389e';
  const BUSDAddress = '0x4Fabb145d64652a948d72533023f6E7A623C7C53';
  const chain = {
    base: ChainBase.Ethereum,
    network: ChainNetwork.ERC20,
    substrate_spec: null,
    contract_address: BUSDAddress,
    verbose_logging: false,
    ChainNode: { id: 1, url: 'http://127.0.0.1:8545', name: chainName },
    origin: chainName,
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
      const listeners: IListenerInstances = await runSubscriberAsFunction(
        rmq,
        chain
      );
      listener = listeners[getErcListenerName(chain)] as Listener<
        IErc20Contracts,
        never,
        Processor,
        Subscriber,
        EventKind
      >;
    });

    it('Should capture transfer events', async () => {
      const { block } = await sdk.getErc20(
        BUSDAddress,
        randomWallet,
        transferAmount
      );
      await waitUntilBlock(block, listener);

      const msg = rmq.queuedMessages[RascalSubscriptions.ChainEvents][0];
      events[EventKind.Transfer] = msg;
      expect(
        rmq.queuedMessages[RascalSubscriptions.ChainEvents].length
      ).to.equal(1, 'Should have captured 1 transfer event');
      console.log('>>>>>>>>>>>>>>>>>>Transfer event: ', msg);
      cwEventMatch(msg, {
        kind: EventKind.Transfer,
        chainName,
        blockNumber: block,
        contractAddress: chain.contract_address,
        transferAmount,
        to: randomWallet,
      });
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
      console.log('>>>>>>>>>>>>>>>>>>Approval event: ', msg);
      cwEventMatch(msg, {
        kind: EventKind.Approval,
        chainName,
        blockNumber: block,
        contractAddress: chain.contract_address,
        transferAmount,
      });
    });
  });

  describe.skip('Tests for processing ERC20 events with the consumer', async () => {
    before(async () => {
      // set up the chain consumer - this starts the subscriptions thus processing all existing events
      await setupChainEventConsumer(rmq);
    });

    it('Should process transfer events', async () => {
      const transferEvent = await models.ChainEvent.findOne({
        where: {
          chain_name: chainName,
          event_data: {
            [Op.and]: [
              Sequelize.literal(`event_data->>'kind' = 'transfer'`),
              Sequelize.literal(
                `event_data->>'value' = '${Web3.utils.toWei(transferAmount)}'`
              ),
            ],
          },
          block_number: events['transfer'].blockNumber,
          contract_address: chain.contract_address,
        },
      });
      expect(transferEvent, 'The transfer event should be in the database').to
        .exist;
    });

    it('Should process approval events', async () => {
      const approvalEvent = await models.ChainEvent.findOne({
        where: {
          chain_name: chainName,
          event_data: {
            [Op.and]: [
              Sequelize.literal(`event_data->>'kind' = 'approval'`),
              Sequelize.literal(
                `event_data->>'value' = '${Web3.utils.toWei(transferAmount)}'`
              ),
            ],
          },
          block_number: events['approval'].blockNumber,
          contract_address: chain.contract_address,
        },
      });
      expect(approvalEvent, 'The approval event should be in the database').to
        .exist;
    });
  });

  describe.skip('Tests for retrieving ERC20 events with the app', () => {
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
      where: {
        chain_name: chainName,
        contract_address: chain.contract_address,
      },
    });
    await models.ChainEntity.destroy({
      where: {
        chain_name: chainName,
        contract_address: chain.contract_address,
      },
    });
  });
});
