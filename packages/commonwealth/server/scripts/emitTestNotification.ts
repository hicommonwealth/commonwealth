import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';
import models from '../database';
import { NotificationCategories } from 'common-common/src/types';
import Sequelize, { Transaction } from 'sequelize';
import {
  NotificationAttributes,
  NotificationInstance,
} from '../models/notification';
import { SubscriptionInstance } from '../models/subscription';
import { factory, formatFilename } from 'common-common/src/logging';
import emitNotifications from '../util/emitNotifications';
import { DATABASE_URI } from '../config';

const log = factory.getLogger(formatFilename(__filename));

enum SupportedNotificationChains {
  dydx = 'dydx',
  osmosis = 'osmosis',
}

enum SupportedNotificationSpaces {
  stgdao = 'stgdao.eth',
}

const ceNotifications = {
  [SupportedNotificationChains.dydx]: {
    queued: 0,
    id: 123456789,
    block_number: 17477983,
    event_data: {
      id: 999999999,
      kind: 'proposal-created',
      values: ['0'],
      targets: ['0xE710CEd57456D3A16152c32835B5FB4E72D9eA5b'],
      endBlock: 17510899,
      executor: '0x64c7d40c07EFAbec2AafdC243bF59eaF2195c6dc',
      ipfsHash:
        '0x5aca381042cb641c1000126d5a183c38b17492eb60a86910973d0c3f1e867f43',
      proposer: '0xB933AEe47C438f22DE0747D57fc239FE37878Dd1',
      strategy: '0x90Dfd35F4a0BB2d30CDf66508085e33C353475D9',
      calldatas: ['randomcalldatas'],
      signatures: ['transfer(address,address,uint256)'],
      startBlock: 17484576,
    },
    network: 'aave',
    chain: 'dydx',
    updated_at: '2023-06-19T11:50:52.308Z',
    created_at: '2023-06-19T11:50:52.262Z',
  },
};

const snapshotNotifications = {
  [SupportedNotificationSpaces.stgdao]: {
    eventType: 'proposal/created',
    space: SupportedNotificationSpaces.stgdao,
    id: '0xrandomid',
    title: 'Test Snapshot Proposal Title',
    body: 'Test snapshot proposal body',
    choices: ['Yes', 'No', 'Abstain'],
    start: 1691423562,
    expire: 1691872844,
  },
};

async function getExistingNotifications(
  transaction: Transaction,
  chainId?: string,
  snapshotId?: string
): Promise<NotificationInstance[]> {
  let existingNotifications: NotificationInstance[];
  if (chainId) {
    log.info(`Replacing a real notification for chain: ${chainId}`);
    existingNotifications = await models.Notification.findAll({
      where: {
        category_id: NotificationCategories.ChainEvent,
        chain_id: chainId,
      },
      order: Sequelize.literal(`RANDOM()`),
      limit: 1,
      transaction,
    });
  } else {
    log.info(`Replacing a real notification for snapshot space: ${snapshotId}`);
    existingNotifications = await models.Notification.findAll({
      where: {
        category_id: NotificationCategories.SnapshotProposal,
        [Sequelize.Op.and]: [
          Sequelize.literal(
            `notification_data::jsonb ->> 'space' = '${snapshotId}'`
          ),
        ],
      },
      order: Sequelize.literal('RANDOM()'),
      limit: 1,
      transaction,
    });
  }

  return existingNotifications;
}

/**
 * Creates a notification. IF mockNotification is true, then a fake notification is created. If mock is false, then
 * an existing notification is found, deleted, and a new one is created with the exact same data. This allows us to
 * update the primary key (id) of the notification. In other words, we are pretending we just received an old event and
 * are emitting a notification for it.
 * @param transaction
 * @param mockNotification
 * @param chainId
 * @param snapshotId
 */
async function setupNotification(
  transaction: Transaction,
  mockNotification: boolean,
  chainId?: string,
  snapshotId?: string
): Promise<string> {
  if (!chainId && !snapshotId) {
    throw new Error('Must provide either a chainId or a snapshotId');
  }

  let existingNotifications: NotificationInstance[];
  if (mockNotification && chainId) {
    const existingCeMockNotif = await models.Notification.findAll({
      where: {
        category_id: NotificationCategories.ChainEvent,
        chain_id: chainId,
        [Sequelize.Op.and]: [
          Sequelize.literal(
            `notification_data::jsonb -> 'event_data' ->> 'id' = '${ceNotifications[chainId].event_data.id}'`
          ),
        ],
      },
      logging: console.log,
    });

    if (existingCeMockNotif.length > 0)
      existingNotifications = existingCeMockNotif;
    else return JSON.stringify(ceNotifications[chainId]);
  } else if (mockNotification && snapshotId) {
    return JSON.stringify(snapshotNotifications[snapshotId]);
  }

  if (!existingNotifications) {
    existingNotifications = await getExistingNotifications(
      transaction,
      chainId,
      snapshotId
    );
  }

  if (existingNotifications.length === 0) {
    throw new Error(
      `No existing chain-event notification found for ${
        chainId || snapshotId
      }. ` + `Please try a different ${chainId ? 'chain id' : 'snapshot id'}.`
    );
  }

  const existingNotif = existingNotifications[0];
  log.info(`Replacing existing notification with id ${existingNotif.id}`);

  await models.NotificationsRead.destroy({
    where: {
      notification_id: existingNotif.id,
    },
    transaction,
  });
  await existingNotif.destroy({ transaction });
  log.info(`Deleted the existing notification and notifications read.`);

  const newNotifData = existingNotif.toJSON();

  // const result = await models.Notification.create(newNotifData, { transaction });
  // log.info(`Created a new (replicated) notification with id ${result.id}`);
  return newNotifData.notification_data;
}

async function main() {
  const argv = await yargs(hideBin(process.argv)).options({
    chain_id: {
      alias: 'c',
      type: 'string',
      demandOption: false,
      conflicts: 'snapshot_id',
      description:
        'Name of chain to generate a test chain-event notification for',
    },
    snapshot_id: {
      alias: 's',
      type: 'string',
      demandOption: false,
      conflicts: 'chain',
      description:
        'Name of the snapshot space to generate a test snapshot-proposal notification for',
    },
    wallet_address: {
      alias: 'w',
      type: 'string',
      demandOption: false,
      conflicts: 'user_id',
      description:
        'Wallet address of the user to generate a test notification for',
    },
    user_id: {
      alias: 'u',
      type: 'number',
      demandOption: false,
      conflicts: 'wallet_address',
      description: 'User id of the user to generate a test notification for',
    },
    mock_notification: {
      alias: 'm',
      type: 'boolean',
      demandOption: true,
      default: false,
      description:
        'Whether to create a mock notification or use a real existing one. ' +
        'A mock notification will not link to a real chain-event or snapshot-proposal.',
    },
  }).argv;

  const transaction = await models.sequelize.transaction();
  let notifData: string;
  try {
    let userId: number;
    if (argv.user_id) {
      userId = argv.user_id;
    } else {
      const address = await models.Address.findOne({
        where: {
          address: argv.wallet_address,
        },
        transaction,
      });

      if (!address) {
        log.error(
          'Wallet address not found. ' +
            'Make sure the given address is an address you have used to login before.'
        );
        process.exit(1);
      } else {
        userId = address.user_id;
      }
    }

    let result: [SubscriptionInstance, boolean];
    if (argv.chain_id) {
      result = await models.Subscription.findOrCreate({
        where: {
          subscriber_id: userId,
          chain_id: argv.chain_id,
          category_id: NotificationCategories.ChainEvent,
        },
        transaction,
      });
    } else {
      result = await models.Subscription.findOrCreate({
        where: {
          subscriber_id: userId,
          snapshot_id: argv.snapshot_id,
          category_id: NotificationCategories.SnapshotProposal,
        },
        transaction,
      });
    }
    log.info(`Found or created a subscription with id: ${result[0].id}`);

    notifData = await setupNotification(
      transaction,
      argv.mock_notification,
      argv.chain_id,
      argv.snapshot_id
    );

    await transaction.commit();
  } catch (e) {
    await transaction.rollback();
    throw e;
  }

  if (!notifData) {
    throw new Error('No notification data found');
  }

  await emitNotifications(models, {
    categoryId: argv.chain_id
      ? NotificationCategories.ChainEvent
      : NotificationCategories.SnapshotProposal,
    data: JSON.parse(notifData),
  });

  log.info('Notification successfully emitted');
}

/**
 * In order to execute this script on Frack, Frick, Beta, or any Heroku environment you must run
 * the yarn script (yarn emit-notification) on a Heroku one-off dyno.
 * To run a one-off dyno use `heroku run bash -a [app-name]`.
 */
if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.log('Failed to emit a notification:', err);
      process.exit(1);
    });
}
