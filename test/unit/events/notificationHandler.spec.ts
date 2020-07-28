/* eslint-disable no-unused-expressions */
/* eslint-disable dot-notation */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';

import { CWEvent, SubstrateTypes } from '@commonwealth/chain-events';

import { resetDatabase } from '../../../server-test';
import models from '../../../server/database';
import { NotificationCategories } from '../../../shared/types';
import StorageHandler from '../../../server/eventHandlers/storage';
import NotificationHandler from '../../../server/eventHandlers/notifications';

chai.use(chaiHttp);
const { assert } = chai;

const setupUserAndEventSubscriptions = async (email, address, chain) => {
  const user = await models['User'].create({
    email,
    emailVerified: true,
    isAdmin: false,
    lastVisited: '{}',
  });

  await models['Address'].create({
    user_id: user.id,
    address,
    chain,
    selected: true,
    verification_token: 'PLACEHOLDER',
    verification_token_expires: null,
    verified: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  });

  await models['Subscription'].create({
    subscriber_id: user.id,
    category_id: NotificationCategories.ChainEvent,
    object_id: 'edgeware-democracy-started',
    is_active: true,
  });

  await models['Subscription'].create({
    subscriber_id: user.id,
    category_id: NotificationCategories.ChainEvent,
    object_id: 'edgeware-slash',
    is_active: true,
  });
};

const setupDbEvent = async (event: CWEvent) => {
  const storageHandler = new StorageHandler(models, 'edgeware');
  return storageHandler.handle(event);
};

describe('Event Handler Tests', () => {
  before('reset database', async () => {
    await resetDatabase();

    await setupUserAndEventSubscriptions(
      'alice@gmail.com',
      '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      'edgeware',
    );

    await setupUserAndEventSubscriptions(
      'bob@gmail.com',
      '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      'edgeware',
    );
  });

  it('should create chain event and emit notification', async () => {
    // setup
    const event: CWEvent = {
      blockNumber: 10,
      data: {
        kind: SubstrateTypes.EventKind.DemocracyStarted,
        referendumIndex: 0,
        endBlock: 100,
        proposalHash: 'hash',
        voteThreshold: 'Supermajorityapproval',
      }
    };

    const dbEvent = await setupDbEvent(event);
    const eventHandler = new NotificationHandler(models);

    // process event
    const handledDbEvent = await eventHandler.handle(event, dbEvent);
    assert.deepEqual(dbEvent, handledDbEvent);

    // expect results
    const notifications = await models['Notification'].findAll({
      where: {
        chain_event_id: dbEvent.id,
      },
      include: [{
        model: models['Subscription'],
        include: [{
          model: models['User'],
        }]
      }]
    });
    const userEmails = notifications.map((n) => n.Subscription.User.email);
    assert.sameMembers(userEmails, ['alice@gmail.com', 'bob@gmail.com']);
  });

  it('should only include specified users if includeAddresses present', async () => {
    // setup
    const event: CWEvent = {
      blockNumber: 11,
      includeAddresses: ['5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'],
      data: {
        kind: SubstrateTypes.EventKind.Slash,
        validator: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        amount: '10000',
      }
    };

    const dbEvent = await setupDbEvent(event);
    const eventHandler = new NotificationHandler(models);

    // process event
    const handledDbEvent = await eventHandler.handle(event, dbEvent);
    assert.deepEqual(dbEvent, handledDbEvent);

    // expect results
    const notifications = await models['Notification'].findAll({
      where: {
        chain_event_id: dbEvent.id,
      },
      include: [{
        model: models['Subscription'],
        include: [{
          model: models['User'],
        }]
      }]
    });

    // should only notify bob
    const userEmails = notifications.map((n) => n.Subscription.User.email);
    assert.sameMembers(userEmails, ['bob@gmail.com']);
  });

  it('should only exclude specified users if excludeAddresses present', async () => {
    // setup
    const event: CWEvent = {
      blockNumber: 12,
      excludeAddresses: ['5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'],
      data: {
        kind: SubstrateTypes.EventKind.DemocracyStarted,
        referendumIndex: 1,
        proposalHash: 'hash',
        voteThreshold: 'Supermajorityapproval',
        endBlock: 101,
      }
    };

    const dbEvent = await setupDbEvent(event);
    const eventHandler = new NotificationHandler(models);

    // process event
    const handledDbEvent = await eventHandler.handle(event, dbEvent);
    assert.deepEqual(dbEvent, handledDbEvent);

    // expect results
    const notifications = await models['Notification'].findAll({
      where: {
        chain_event_id: dbEvent.id,
      },
      include: [{
        model: models['Subscription'],
        include: [{
          model: models['User'],
        }]
      }]
    });

    // should only notify alice, excluding bob
    const userEmails = notifications.map((n) => n.Subscription.User.email);
    assert.sameMembers(userEmails, ['alice@gmail.com']);
  });

  it('should not emit notifications with unknown db event', async () => {
    const event: CWEvent = {
      blockNumber: 12,
      excludeAddresses: ['5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'],
      data: {
        kind: SubstrateTypes.EventKind.DemocracyStarted,
        referendumIndex: 1,
        proposalHash: 'hash',
        voteThreshold: 'Supermajorityapproval',
        endBlock: 101,
      }
    };

    const eventHandler = new NotificationHandler(models);

    // process event
    const notificationCount = await models['Notification'].count();
    const handledEvent = await eventHandler.handle(event, null);
    const postEventNotificationCount = await models['Notification'].count();

    // confirm nothing happened
    assert.isUndefined(handledEvent);
    assert.equal(notificationCount, postEventNotificationCount);
  });
});
