import {
  CWEvent,
  SubstrateTypes,
  SupportedNetwork,
} from 'chain-events/src';

import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import models from '../../../server/database';
import { setupSubscriptions, setupDbEvent } from './util';
import NotificationHandler from '../../../server/eventHandlers/notifications';

chai.use(chaiHttp);
const { assert } = chai;

describe('Snapshot Consumer Tests', () => {
  let aliceId, bobId;
  before('reset database', async () => {
    aliceId = await setupSubscriptions(
      'alice@gmail.com',
      '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      'edgeware'
    );

    bobId = await setupSubscriptions(
      'bob@gmail.com',
      '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      'edgeware'
    );
  });

  it('should create chain event and emit notification', async () => {
    // setup
    const event: CWEvent = {
      blockNumber: 10,
      network: SupportedNetwork.Substrate,
      data: {
        kind: SubstrateTypes.EventKind.DemocracyStarted,
        referendumIndex: 0,
        endBlock: 100,
        proposalHash: 'hash',
        voteThreshold: 'Supermajorityapproval',
      },
    };

    const dbEvent = await setupDbEvent(event);
    const eventHandler = new NotificationHandler(models);

    // process event
    const handledDbEvent = await eventHandler.handle(event, dbEvent);
    assert.deepEqual(dbEvent, handledDbEvent);

    const notifications = await models['Notifications'].findAll({
      where: {
        chain_event_id: dbEvent.id,
      },
      include: [
        {
          model: models['NotificationsRead'],
          include: [
            {
              model: models['Subscription'],
              where: {
                subscriber_id: [aliceId, bobId],
              },
            },
          ],
        },
      ],
    });

    const userIds = notifications.map(
      (n) => n.NotificationsRead.Subscription.subscriber_id
    );
    assert.sameMembers(userIds, [aliceId, bobId]);
  });

});
