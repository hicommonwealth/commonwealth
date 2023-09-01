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

const log = factory.getLogger(formatFilename(__filename));

enum SupportedNotificationChains {
  dydx = 'dydx',
  osmosis = 'osmosis',
}

enum SupportedNotificationSpaces {
  stgdao = 'stgdao.eth',
}

const ceNotifications = {
  [SupportedNotificationChains.dydx]: {},
  [SupportedNotificationChains.osmosis]: {},
};

const snapshotNotifications = {
  [SupportedNotificationSpaces.stgdao]: {},
};

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

  if (mockNotification && chainId) {
    return ceNotifications[chainId];
  } else if (mockNotification && snapshotId) {
    return snapshotNotifications[snapshotId];
  }

  let existingNotifications: NotificationInstance[];
  if (chainId) {
    log.info(`Replacing a real notification for chain: ${chainId}`);
    existingNotifications = await models.Notification.findAll({
      where: {
        category_id: NotificationCategories.ChainEvent,
        chain_id: chainId,
      },
      order: Sequelize.literal(
        `notification_data::jsonb -> 'event_data' ->> 'id'`
      ),
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
      order: [['created_at', 'DESC']],
      limit: 1,
      transaction,
    });
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
      description: 'uUser id of the user to generate a test notification for',
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
    await transaction?.rollback();
    throw e;
  }

  await emitNotifications(models, {
    categoryId: argv.chain_id
      ? NotificationCategories.ChainEvent
      : NotificationCategories.SnapshotProposal,
    data: JSON.parse(notifData),
  });

  log.info('Notification successfully emitted');
}

if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      log.error(err);
      process.exit(1);
    });
}
