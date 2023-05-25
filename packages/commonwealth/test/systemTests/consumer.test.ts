import chai from 'chai';
import type { ChainEventAttributes } from 'chain-events/services/database/models/chain_event';
import type { CWEvent } from 'chain-events/src';
import { SupportedNetwork } from 'chain-events/src';
import type * as AaveTypes from 'chain-events/src/chains/aave/types';
import type { ITransfer } from 'chain-events/src/chains/aave/types';
import { EventKind } from 'chain-events/src/chains/aave/types';
import type {
  RmqCENotificationCUD,
  RmqEntityCUD,
} from 'common-common/src/rabbitmq/types';
import {
  RascalExchanges,
  RascalQueues,
  RascalRoutingKeys,
} from 'common-common/src/rabbitmq/types';
import { getQueueStats, publishRmqMsg } from 'common-common/src/rabbitmq/util';
import type { ServiceConsumer } from 'common-common/src/serviceConsumer';
import { v4 as uuidv4 } from 'uuid';
import { setupCommonwealthConsumer } from '../../server/CommonwealthConsumer/CommonwealthConsumer';
import { RABBITMQ_API_URI } from '../../server/config';
import models from '../../server/database';

const { expect } = chai;

describe('Tests for the commonwealth-app consumer', () => {
  let serviceConsumer: ServiceConsumer;

  beforeEach(async () => {
    const preQueueStats = await getQueueStats(
      RABBITMQ_API_URI,
      RascalQueues.ChainEvents
    );
    expect(preQueueStats.consumers).to.equal(
      0,
      'Ensure all other RabbitMQ connections are inactive'
    );

    serviceConsumer = await setupCommonwealthConsumer();

    // api refreshes every 5 seconds so ensure ample time is given
    // await new Promise(resolve => setTimeout(resolve, 10000));
  });

  afterEach(async () => {
    await serviceConsumer.shutdown();
    // api refreshes every 5 seconds so ensure ample time is given
    await new Promise((resolve) => setTimeout(resolve, 10000));
  });

  it('Should process chain-event-notification messages from the CENotificationsCUD queue', async () => {
    const ceData: ITransfer = {
      kind: EventKind.Transfer,
      tokenAddress: uuidv4(),
      from: uuidv4(),
      to: uuidv4(),
      amount: uuidv4(),
    };
    // // create a fake aave-transfer event
    const cwEvent: CWEvent<AaveTypes.IEventData> = {
      blockNumber: Math.floor(Math.random() * 1000000),
      data: ceData,
      network: SupportedNetwork.Aave,
      chain: 'aave',
    };

    const cet = {
      id: `${cwEvent.chain}-${ceData.kind}`,
      chain: cwEvent.chain,
      event_network: cwEvent.network,
      event_name: ceData.kind,
      queued: -1,
    };

    const maxCeId: number = await models.Notification.max('chain_event_id');
    if (!maxCeId)
      throw new Error('Failed to get max chain-event notification id');

    const chainEvent: ChainEventAttributes = {
      id: maxCeId + 1,
      block_number: cwEvent.blockNumber,
      event_data: ceData,
      queued: -1,
      network: cwEvent.network,
      chain: cwEvent.chain,
    };

    const ceNotifCUD: RmqCENotificationCUD.RmqMsgType = {
      ChainEvent: chainEvent,
      event: cwEvent,
      cud: 'create',
    };

    const publishJson = await publishRmqMsg(
      RABBITMQ_API_URI,
      RascalExchanges.CUD,
      RascalRoutingKeys.ChainEventNotificationsCUD,
      ceNotifCUD
    );
    expect(publishJson.routed, 'Failed to publish message').to.be.true;

    // give time for the consumer to process the message
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const dbResult = await models.Notification.findOne({
      where: {
        chain_event_id: chainEvent.id,
      },
    });
    expect(dbResult).to.not.be.null;

    await models.Notification.destroy({
      where: {
        chain_event_id: chainEvent.id,
      },
    });
  });
});
