import {
  SubstrateTypes,
  CWEvent,
} from '@commonwealth/chain-events';
import RabbitMQConfig from '../util/rabbitmq/RabbitMQConfig';

import { HANDLE_IDENTITY, DATABASE_URI } from '../config';

import * as WebSocket from 'ws';
import EventNotificationHandler from '../eventHandlers/notifications';
import EventStorageHandler from '../eventHandlers/storage'
import EntityArchivalHandler from '../eventHandlers/entityArchival';
import IdentityHandler from '../eventHandlers/identity';
import UserFlagsHandler from '../eventHandlers/userFlags';
import ProfileCreationHandler from '../eventHandlers/profileCreation';
import { factory, formatFilename } from '../../shared/logging';
import { Consumer } from '../util/rabbitmq/consumer';
import { Pool } from 'pg';
import models from '../database'

const log = factory.getLogger(formatFilename(__filename));


const setupChainEventListeners = async (
  _models,
  wss: WebSocket.Server,
): Promise<{}> => {
  const pool = new Pool({ // TODO: convert to sequelize - remove pgIdentity from CW (not from CE)
    connectionString: DATABASE_URI,
    ssl: {
      rejectUnauthorized: false
    },
  });

  pool.on('error', (err, client) => {
    log.error('Unexpected error on idle client', err);
  });


  // writes events into the db as ChainEvents rows
  const storageHandler = new EventStorageHandler(
    _models,
    null
  );

  // emits notifications by writing into the db's Notifications table, and also optionally
  // sending a notification to the client via websocket
  const excludedNotificationEvents = [
    SubstrateTypes.EventKind.DemocracyTabled
  ];
  const notificationHandler = new EventNotificationHandler(
    _models,
    wss,
    excludedNotificationEvents
  );

  // creates and updates ChainEntity rows corresponding with entity-related events
  const entityArchivalHandler = new EntityArchivalHandler(
    _models, null, wss
  );

  // creates empty Address and OffchainProfile models for users who perform certain
  // actions, like voting on proposals or registering an identity
  const profileCreationHandler = new ProfileCreationHandler(
    _models, null
  );

  const allChainEventHandlers = [storageHandler, notificationHandler, entityArchivalHandler, profileCreationHandler]

  // populates identity information in OffchainProfiles when received (Substrate only)
  const identityHandler = new IdentityHandler(_models, null);

  // populates is_validator and is_councillor flags on Addresses when validator and
  // councillor sets are updated (Substrate only)
  const userFlagsHandler = new UserFlagsHandler(_models, null);

  const substrateEventHandlers = [identityHandler, userFlagsHandler]

  // get all chains that
  const substrateChains = (await pool.query(`SELECT "id" FROM "Chains" WHERE "base"='substrate';`)).rows.map(obj => obj.id)
  const erc20Tokens = (await pool.query(`SELECT "id" FROM "Chains" WHERE "base"='ethereum' AND "type"='token';`)).rows.map(obj => obj.id)

  // feed the events into their respective handlers
  async function processClassicEvents(event: CWEvent): Promise<void> {
    let prevResult = null;
    for (const handler of allChainEventHandlers) {
      try {
        prevResult = await handler.handle(event, prevResult);
      } catch (err) {
        // unknown chain event originates from the webhookNotifier which does not support erc20 events and thus throws if an erc20 event is given
        if (err.message != 'unknown chain event') {
          log.error(`Classic event handle failure for the following event: ${JSON.stringify(event, null, 2)}`, err);
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
    try {
      await identityHandler.handle(event, null);
    } catch (err) {
      log.error(`Identity event handle failure: ${err.message}`);
    }
  }

  let eventsSubscriber, identitySubscriber;

  const consumer = new Consumer(RabbitMQConfig);
  await consumer.init();

  eventsSubscriber = await consumer.consumeEvents(
    processClassicEvents,
    'eventsSub'
  );

  if (HANDLE_IDENTITY === 'publish') {
    identitySubscriber = await consumer.consumeEvents(
      processIdentityEvents,
      'identitySub'
    );
  }

  log.info('Consumer started')
  return {eventsSubscriber, identitySubscriber};
};

async function main() {
  try {
    log.info('Starting consumer...')
    await setupChainEventListeners(models, null)
  } catch (error) {
    log.fatal('Consumer setup failed', error);
  }
}

main();

