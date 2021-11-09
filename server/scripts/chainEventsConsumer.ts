import { SubstrateTypes, CWEvent } from '@commonwealth/chain-events';
import * as WebSocket from 'ws';
import RabbitMQConfig from '../util/rabbitmq/RabbitMQConfig';

import { HANDLE_IDENTITY } from '../config';

import EventNotificationHandler from '../eventHandlers/notifications';
import EventStorageHandler from '../eventHandlers/storage';
import EntityArchivalHandler from '../eventHandlers/entityArchival';
import IdentityHandler from '../eventHandlers/identity';
import UserFlagsHandler from '../eventHandlers/userFlags';
import ProfileCreationHandler from '../eventHandlers/profileCreation';
import { ChainBase } from '../../shared/types';
import { factory, formatFilename } from '../../shared/logging';
import { Consumer } from '../util/rabbitmq/consumer';
import models from '../database';

const log = factory.getLogger(formatFilename(__filename));

const setupChainEventListeners = async (wss: WebSocket.Server): Promise<{}> => {
  // writes events into the db as ChainEvents rows
  const storageHandler = new EventStorageHandler(models, null);

  // emits notifications by writing into the db's Notifications table, and also optionally
  // sending a notification to the client via websocket
  const excludedNotificationEvents = [SubstrateTypes.EventKind.DemocracyTabled];
  const notificationHandler = new EventNotificationHandler(
    models,
    wss,
    excludedNotificationEvents
  );

  // creates and updates ChainEntity rows corresponding with entity-related events
  const entityArchivalHandler = new EntityArchivalHandler(models, null, wss);

  // creates empty Address and OffchainProfile models for users who perform certain
  // actions, like voting on proposals or registering an identity
  const profileCreationHandler = new ProfileCreationHandler(models, null);

  const allChainEventHandlers = [
    storageHandler,
    notificationHandler,
    entityArchivalHandler,
    profileCreationHandler,
  ];

  // populates identity information in OffchainProfiles when received (Substrate only)
  const identityHandler = new IdentityHandler(models, null);

  // populates is_validator and is_councillor flags on Addresses when validator and
  // councillor sets are updated (Substrate only)
  const userFlagsHandler = new UserFlagsHandler(models, null);

  const substrateEventHandlers = [identityHandler, userFlagsHandler];

  const substrateChains = (
    await models.Chain.findAll({
      attributes: ['id'],
      where: {
        base: ChainBase.Substrate,
      },
    })
  ).map((o) => o.id);

  // feed the events into their respective handlers
  async function processClassicEvents(event: CWEvent): Promise<void> {
    log.debug(`Received event: ${JSON.stringify(event, null, 2)}`);
    let prevResult = null;
    for (const handler of allChainEventHandlers) {
      try {
        prevResult = await handler.handle(event, prevResult);
      } catch (err) {
        // unknown chain event originates from the webhookNotifier which does not support erc20 events
        // and thus throws if an erc20 event is given
        if (err.message !== 'unknown chain event') {
          log.error(
            `Classic event handle failure for the following event: ${JSON.stringify(
              event,
              null,
              2
            )}`,
            err
          );
          break;
        }
      }
    }
    if (substrateChains.includes(event.chain)) {
      for (const handler of substrateEventHandlers) {
        try {
          prevResult = await handler.handle(event, prevResult);
        } catch (err) {
          log.error(`Substrate event handle failure: ${err.message}`);
          break;
        }
      }
    }
  }

  async function processIdentityEvents(event: CWEvent): Promise<void> {
    log.debug(`Received event: ${JSON.stringify(event, null, 2)}`);
    try {
      await identityHandler.handle(event, null);
    } catch (err) {
      log.error(`Identity event handle failure: ${err.message}`);
    }
  }

  const consumer = new Consumer(RabbitMQConfig);
  await consumer.init();

  const eventsSubscriber = await consumer.consumeEvents(
    processClassicEvents,
    'ChainEventsHandlersSubscription'
  );

  const identitySubscriber = await consumer.consumeEvents(
      processIdentityEvents,
      'SubstrateIdentityEventsSubscription'
  );

  log.info('Consumer started');
  return { eventsSubscriber, identitySubscriber };
};

async function main() {
  try {
    log.info('Starting consumer...');
    await setupChainEventListeners(null);
  } catch (error) {
    log.fatal('Consumer setup failed', error);
  }
}

main();
