import { NotificationCategories } from '@hicommonwealth/core';
import { expect } from 'chai';
import sinon from 'sinon';
import models from '../../../../server/database';
import { ContractInstance } from '../../../../server/models/contract';
import { startEvmPolling } from '../../../../server/workers/evmChainEvents/startEvmPolling';
import {
  getTestAbi,
  getTestCommunityContract,
  getTestContract,
  getTestSignatures,
  getTestSubscription,
  testChainId,
} from '../../../integration/evmChainEvents/util';
import { getEvmSecondsAndBlocks, sdk } from './util';

async function verifyNumNotifications(num: number) {
  const notifications = await models.Notification.findAll();
  expect(notifications.length).to.equal(num);
}

async function verifyBlockNumber(
  chainNodeId: number,
  blockNumber: null | number,
) {
  const lastBlock = await models.LastProcessedEvmBlock.findOne({
    where: {
      chain_node_id: chainNodeId,
    },
  });

  let lastBlockNum: number;
  if (!lastBlock && blockNumber === null) {
    return;
  } else if (!lastBlock && blockNumber !== null) {
    throw new Error('Last processed block not found');
  } else {
    lastBlockNum = lastBlock.block_number;
  }

  if (blockNumber === null) {
    expect(lastBlockNum).to.be.null;
  } else {
    expect(lastBlockNum).to.be.gte(blockNumber);
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('EVM Chain Events End to End Tests', () => {
  const sandbox = sinon.createSandbox();
  let clock: sinon.SinonFakeTimers;
  let propCreatedResult: { block: number; proposalId: string };
  let contract: ContractInstance;

  before(async () => {
    const currentBlock = (await sdk.getBlock()).number;
    // advance time to avoid test interaction issues
    await sdk.safeAdvanceTime(currentBlock + 501);
    await models.LastProcessedEvmBlock.destroy({
      where: {},
    });
    await models.EvmEventSource.destroy({
      where: {},
    });
  });

  beforeEach(async () => {
    clock = sandbox.useFakeTimers();
    await models.NotificationsRead.destroy({
      where: {},
    });
    await models.Notification.destroy({
      where: {},
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should not emit any notifications if there are no event sources', async () => {
    const intervalId = await startEvmPolling(10_000);
    await verifyNumNotifications(0);
    // triggers first timeout
    await clock.tickAsync(1);
    // awaits response of first timer before ticking
    await clock.tickAsync(1);
    await verifyNumNotifications(0);
    clearInterval(intervalId);
  }).timeout(80_000);

  it('should emit a notification for every captured event that has a valid event source', async () => {
    await getTestCommunityContract();
    await getTestSubscription();
    const abi = await getTestAbi();
    contract = await getTestContract();
    await contract.update({ abi_id: abi.id });
    await getTestSignatures();

    // create proposal notification
    await sdk.getVotingPower(1, '400000');
    propCreatedResult = await sdk.createProposal(1);
    console.log(
      `Proposal created at block ${propCreatedResult.block} with id ${propCreatedResult.proposalId}`,
    );

    await verifyNumNotifications(0);
    await verifyBlockNumber(contract.chain_node_id, null);
    const intervalId = await startEvmPolling(10_000);
    clearInterval(intervalId);
    await clock.tickAsync(1);
    clock.restore();

    // tickAsync doesn't await callback execution thus sleep is necessary
    await sleep(5000);
    await verifyBlockNumber(contract.chain_node_id, propCreatedResult.block);
    const notifications = await models.Notification.findAll();
    expect(notifications.length).to.equal(1);
    const notification = notifications[0].toJSON();
    expect(notification).to.have.own.property('community_id', testChainId);
    expect(notification).to.have.own.property(
      'category_id',
      NotificationCategories.ChainEvent,
    );
    expect(notification).to.have.own.property(
      'category_id',
      NotificationCategories.ChainEvent,
    );
    expect(notification).to.have.own.property('notification_data');
    expect(JSON.parse(notification.notification_data)).to.have.property(
      'block_number',
      propCreatedResult.block,
    );
    expect(JSON.parse(notification.notification_data)).to.have.nested.property(
      'event_data.id',
      propCreatedResult.proposalId,
    );
  }).timeout(80_000);

  it.skip(
    'should stop emitting notifications if an event source is no longer subscribed to',
    async () => {
      const intervalId = await startEvmPolling(10_000);
      await clock.tickAsync(1);

      await models.Subscription.destroy({
        where: {},
      });

      await verifyNumNotifications(0);
      await verifyBlockNumber(contract.chain_node_id, propCreatedResult.block);

      // generate proposal queued event
      let res = getEvmSecondsAndBlocks(3);
      await sdk.safeAdvanceTime(propCreatedResult.block + res.blocks);
      await sdk.castVote(propCreatedResult.proposalId, 1, true, 'aave');
      res = getEvmSecondsAndBlocks(3);
      await sdk.advanceTime(String(res.secs), res.blocks);
      await sdk.queueProposal(propCreatedResult.proposalId, 'aave');

      await clock.tickAsync(10_000);
      clock.restore();
      clearInterval(intervalId);

      await sleep(5000);
      await verifyNumNotifications(0);
    },
  ).timeout(100_000);
});
