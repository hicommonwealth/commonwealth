import { CWEvent, SubstrateTypes } from 'chain-events/src';
import { SubscriberSessionAsPromised } from 'rascal';
import * as WebSocket from 'ws';

import { factory, formatFilename } from 'common-common/src/logging';
import {
  getRabbitMQConfig,
  RabbitMQController,
  RascalSubscriptions, RmqCWEvent
} from 'common-common/src/rabbitmq';
import { ChainBase } from 'common-common/src/types';
import { RABBITMQ_URI } from "../config";
import models from '../database';
import EntityArchivalHandler from '../eventHandlers/entityArchival';
import IdentityHandler from '../eventHandlers/identity';
import EventNotificationHandler from '../eventHandlers/notifications';
import ProfileCreationHandler from '../eventHandlers/profileCreation';
import EventStorageHandler from '../eventHandlers/storage';
import UserFlagsHandler from '../eventHandlers/userFlags';
import { StatsDController, ProjectTag } from 'common-common/src/statsd';


const log = factory.getLogger(formatFilename(__filename));

const setupChainEventListeners = async (wss: WebSocket.Server):
  Promise<{ eventsSubscriber: SubscriberSessionAsPromised, identitySubscriber: SubscriberSessionAsPromised}> => {

  let consumer: RabbitMQController
  try {
    consumer = new RabbitMQController(getRabbitMQConfig(RABBITMQ_URI));
    await consumer.init();
  } catch (e) {
    log.error("Rascal consumer setup failed. Please check the Rascal configuration");
    throw e
  }

  // writes events into the db as ChainEvents rows
  const storageHandler = new EventStorageHandler(models, null);

  // emits notifications by writing into the db's Notifications table, and also optionally
  // sending a notification to the client via websocket
  const excludedNotificationEvents = [SubstrateTypes.EventKind.DemocracyTabled];
  const notificationHandler = new EventNotificationHandler(
    models,
    wss,
    excludedNotificationEvents,
    consumer
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
    if (!RmqCWEvent.isValidMsgFormat(event)) {
      throw RmqCWEvent.getInvalidFormatError(event);
    }

    StatsDController.get().increment(
      'ce.event',
      {
        chain: event.chain || '',
        network: event.network,
        blockNumber: `${event.blockNumber}`,
        kind: event.data.kind,
        project: ProjectTag.Commonwealth,
      }
    );
    let prevResult = null;
    for (const handler of allChainEventHandlers) {
      try {
        prevResult = await handler.handle(event, prevResult);
      } catch (err) {
        log.error(
          `${handler.name} handler failed to process the following event: ${JSON.stringify(
            event,
            null,
            2
          )}`,
          err
        );
        break;
      }
    }
    if (substrateChains.includes(event.chain)) {
      for (const handler of substrateEventHandlers) {
        try {
          prevResult = await handler.handle(event, prevResult);
        } catch (err) {
          log.error(
            `${handler.name} handler failed to process the following event: ${JSON.stringify(
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
  }

  async function processIdentityEvents(event: CWEvent): Promise<void> {
    log.debug(`Received event: ${JSON.stringify(event, null, 2)}`);
    try {
      await identityHandler.handle(event, null);
    } catch (err) {
      log.error(`Identity event handle failure: ${err.message}`);
    }
  }

  let eventsSubscriber: SubscriberSessionAsPromised, identitySubscriber: SubscriberSessionAsPromised;

  try {
    eventsSubscriber = await consumer.startSubscription(
      processClassicEvents,
      RascalSubscriptions.ChainEvents
    );
  } catch (e) {
    log.info('Failure in ChainEventsHandlersSubscription');
    throw e;
  }

  try {
    identitySubscriber = await consumer.startSubscription(
      processIdentityEvents,
      RascalSubscriptions.SubstrateIdentityEvents
    );
  } catch (e) {
    log.info('Failure in SubstrateIdentityEventsSubscription');
    throw e;
  }


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
