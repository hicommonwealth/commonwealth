import { expect } from 'chai';
import { resetDatabase } from '../../../util/resetDatabase';
import { startEvmPolling } from '../../../../server/workers/evmChainEvents/startEvmPolling';
import sinon from 'sinon';
import models from '../../../../server/database';
import {
  getTestAbi,
  getTestCommunityContract,
  getTestContract,
  getTestSignatures,
  getTestSubscription,
  testChainId,
} from '../../../integration/evmChainEvents/util';
import { sdk } from './util';
import { NotificationCategories } from 'common-common/src/types';

async function verifyNumNotifications(num: number) {
  const notifications = await models.Notification.findAll();
  expect(notifications.length).to.equal(num);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe.only('EVM Chain Events End to End Tests', () => {
  const sandbox = sinon.createSandbox();
  let clock: sinon.SinonFakeTimers;
  let proposalCreatedResult: { block: number; proposalId: string };

  before(async () => {
    await resetDatabase();
  });

  beforeEach(async () => {
    clock = sandbox.useFakeTimers();
    await models.sequelize.query(`DELETE FROM "NotificationsRead";`);
    await models.sequelize.query(`DELETE FROM "Notifications";`);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it.skip('sinon sucks', async () => {
    setTimeout(async () => {
      console.log('Checking');
      await models.Notification.findAll();
      console.log('Finished');
    }, 5000);

    setTimeout(async () => {
      console.log('Checking 2');
      await models.Notification.findAll();
      console.log('Finished 2');
    }, 10_000);

    await clock.tickAsync(5_000);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await clock.tickAsync(10_000);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }).timeout(80_000);

  it('should not emit any notifications if there are no event sources', async () => {
    const intervalId = await startEvmPolling(10_000);
    await verifyNumNotifications(0);
    // triggers first timeout
    await clock.tickAsync(1);
    // awaits response of first timer before ticking
    await clock.tickAsync(1);
    await verifyNumNotifications(0);
  });

  it('should emit a notification for every captured event that has a valid event source', async () => {
    await getTestCommunityContract();
    await getTestSubscription();
    const abi = await getTestAbi();
    const contract = await getTestContract();
    await contract.update({ abi_id: abi.id });
    await getTestSignatures();

    // create proposal notification
    await sdk.getVotingPower(1, '400000', 'aave');
    const propCreatedResult = await sdk.createProposal(1, 'aave');
    console.log(
      `Proposal created at block ${propCreatedResult.block} with id ${propCreatedResult.proposalId}`
    );

    await verifyNumNotifications(0);
    const intervalId = await startEvmPolling(10_000);
    await clock.tickAsync(1);
    // await clock.nextAsync();
    const notifications = await models.Notification.findAll();
    expect(notifications.length).to.equal(1);
    expect(notifications[0]).to.have.own.property('chain_id', testChainId);
    expect(notifications[0]).to.have.own.property(
      'category_id',
      NotificationCategories.ChainEvent
    );
    expect(notifications[0]).to.have.own.property(
      'category_id',
      NotificationCategories.ChainEvent
    );
    expect(notifications[0]).to.have.nested.property(
      'notification_data.block_number',
      propCreatedResult.block
    );
    expect(notifications[0]).to.have.nested.property(
      'notification_data.event_data.id',
      propCreatedResult.proposalId
    );
  }).timeout(80_000);

  it('should stop emitting notifications if an event source is no longer subscribed to', async () => {});
  it('should not throw for any reason', async () => {});
  it('should loop forever', async () => {});
});

describe('processChainNode', () => {
  it('should update the block number of the last processed block', async () => {});
  it('should fetch from the last block stored number onwards', async () => {});
  it('should never throw an error', async () => {});
});
