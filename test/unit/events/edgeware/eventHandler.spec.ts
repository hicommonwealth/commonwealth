/* eslint-disable no-unused-expressions */
/* eslint-disable dot-notation */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';

import { resetDatabase, closeServer } from '../../../../server-test';
import models from '../../../../server/database';
import { NotificationCategories } from '../../../../shared/types';
import EdgewareEventHandler from '../../../../server/eventHandlers/edgeware';
import { CWEvent } from '../../../../shared/events/interfaces';
import { SubstrateEventKind } from '../../../../shared/events/edgeware/types';

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

  after('close database', async () => {
    await closeServer();
  });

  it('should create chain event and emit notification', async () => {
    // setup
    const event: CWEvent = {
      blockNumber: 10,
      data: {
        kind: SubstrateEventKind.DemocracyStarted,
        referendumIndex: 0,
        endBlock: 100,
        proposalHash: 'hash',
        voteThreshold: 'Supermajorityapproval',
      }
    };

    const eventHandler = new EdgewareEventHandler(models, null, 'edgeware');

    // process event
    await eventHandler.handle(event);

    // expect results
    const chainEvents = await models['ChainEvent'].findAll({
      where: {
        chain_event_type_id: 'edgeware-democracy-started',
        block_number: 10,
      }
    });
    assert.lengthOf(chainEvents, 1);
    assert.deepEqual(chainEvents[0].event_data, event.data);

    const notifications = await models['Notification'].findAll({
      where: {
        chain_event_id: chainEvents[0].id,
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
        kind: SubstrateEventKind.Slash,
        validator: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        amount: '10000',
      }
    };

    const eventHandler = new EdgewareEventHandler(models, null, 'edgeware');

    // process event
    await eventHandler.handle(event);

    // expect results
    const chainEvents = await models['ChainEvent'].findAll({
      where: {
        chain_event_type_id: 'edgeware-slash',
        block_number: 11,
      }
    });
    assert.lengthOf(chainEvents, 1);
    assert.deepEqual(chainEvents[0].event_data, event.data);

    const notifications = await models['Notification'].findAll({
      where: {
        chain_event_id: chainEvents[0].id,
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
        kind: SubstrateEventKind.DemocracyStarted,
        referendumIndex: 1,
        proposalHash: 'hash',
        voteThreshold: 'Supermajorityapproval',
        endBlock: 101,
      }
    };

    const eventHandler = new EdgewareEventHandler(models, null, 'edgeware');

    // process event
    await eventHandler.handle(event);

    // expect results
    const chainEvents = await models['ChainEvent'].findAll({
      where: {
        chain_event_type_id: 'edgeware-democracy-started',
        block_number: 12,
      }
    });
    assert.lengthOf(chainEvents, 1);
    assert.deepEqual(chainEvents[0].event_data, event.data);

    const notifications = await models['Notification'].findAll({
      where: {
        chain_event_id: chainEvents[0].id,
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

  it('should not create chain event for unknown event type', async () => {
    const event = {
      blockNumber: 13,

      data: {
        kind: 'democracy-exploded',
        whoops: true,
      }
    };

    const eventHandler = new EdgewareEventHandler(models, null, 'edgeware');

    // process event
    await eventHandler.handle(event as unknown as CWEvent);

    // confirm no event emitted
    const chainEvents = await models['ChainEvent'].findAll({
      where: {
        chain_event_type_id: 'edgeware-democracy-exploded',
        block_number: 12,
      }
    });
    assert.lengthOf(chainEvents, 0);
  });
});
