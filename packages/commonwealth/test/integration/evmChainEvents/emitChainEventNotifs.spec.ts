import { ChainNodeInstance } from '../../../server/models/chain_node';
import {
  getTestChainNode,
  getTestCommunityContract,
  getTestSubscription,
} from './util';
import { emitChainEventNotifs } from '../../../server/workers/evmChainEvents/emitChainEventNotifs';
import { resetDatabase } from '../../util/resetDatabase';
import models from '../../../server/database';
import { expect } from 'chai';
import { BigNumber, ethers } from 'ethers';
import { RawEvmEvent } from '../../../server/workers/evmChainEvents/types';
import { sdk } from '../../devnet/evm/evmChainEvents/util';

describe('emitChainEventNotifs', () => {
  let chainNode: ChainNodeInstance;
  let emitSuccess = false;
  const validEvent: RawEvmEvent = {
    kind: 'proposal-created',
    contractAddress: sdk.contractAddrs.aave.governance,
    blockNumber: 1,
    args: [BigNumber.from(45)],
  };

  before(async () => {
    await resetDatabase();
    chainNode = await getTestChainNode();
    await getTestSubscription();
    await getTestCommunityContract();
  });

  it('should emit a notification for each given proposal event', async () => {
    let notifications = await models.Notification.findAll();
    expect(notifications.length).to.equal(0);

    const events: RawEvmEvent[] = [
      validEvent,
      {
        kind: 'proposal-created',
        contractAddress: sdk.contractAddrs.aave.governance,
        blockNumber: 2,
        args: [BigNumber.from(67)],
      },
    ];

    const result = await emitChainEventNotifs(chainNode.id, events);
    expect(result.length).to.equal(2);
    await Promise.all(result);
    notifications = await models.Notification.findAll();
    expect(notifications.length).to.equal(2);
    emitSuccess = true;
  });

  it('should not emit duplicate notifications', async () => {
    expect(emitSuccess).to.be.true;
    let notifications = await models.Notification.findAll();
    expect(notifications.length).to.equal(2);

    const result = await emitChainEventNotifs(chainNode.id, [validEvent]);
    expect(result.length).to.equal(1);
    await Promise.all(result);
    notifications = await models.Notification.findAll();
    expect(notifications.length).to.equal(2);
  });

  it('should not emit any notifications or throw if there are no events', async () => {
    // we can't capture emitNotification errors so we need to ensure the base case works
    expect(emitSuccess).to.be.true;

    const result = await emitChainEventNotifs(chainNode.id, []);
    expect(result.length).to.equal(0);
    const notifications = await models.Notification.findAll();
    expect(notifications.length).to.equal(2);
  });

  it('should not throw if event format is incorrect', async () => {
    // we can't capture emitNotification errors so we need to ensure the base case works
    expect(emitSuccess).to.be.true;

    const result = await emitChainEventNotifs(chainNode.id, [
      {
        contractAddress: '0x123',
        kind: 'proposal-created',
        blockNumber: 1,
        args: 'not an array' as unknown as ethers.utils.Result,
      },
    ]);
    expect(result.length).to.equal(0);
    const notifications = await models.Notification.findAll();
    expect(notifications.length).to.equal(2);
  });

  it('should not throw if emitting a notification fails', async () => {
    expect(emitSuccess).to.be.true;
    await models.sequelize.query(`DROP TABLE "NotificationsRead"`);
    const result = await emitChainEventNotifs(chainNode.id, [validEvent]);
    expect(result.length).to.equal(1);
    await Promise.all(result);
    const notifications = await models.Notification.findAll();
    expect(notifications.length).to.equal(2);
  });
});
