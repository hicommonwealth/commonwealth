import { NotificationCategories, logger } from '@hicommonwealth/core';
import Sequelize, { Transaction } from 'sequelize';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import models from '../database';
import { NotificationInstance } from '../models/notification';
import { SubscriptionInstance } from '../models/subscription';
import emitNotifications from '../util/emitNotifications';

const log = logger().getLogger(__filename);

enum SupportedNotificationChains {
  dydx = 'dydx',
  kyve = 'kyve',
  osmosis = 'osmosis',
}

enum SupportedNotificationSpaces {
  stgdao = 'stgdao.eth',
}

function getMockNotification(
  randomData: boolean,
  chain?: string,
  snapshot?: string,
) {
  const constantBlockNumber = 987654321;
  const constantPropId = 999999999;

  const randomInt = () => Math.floor(Math.random() * (2 ** 31 - 1)) + 1;

  const ceNotifications = {
    [SupportedNotificationChains.dydx]: {
      block_number: randomData ? randomInt() : constantBlockNumber,
      event_data: {
        id: randomData ? randomInt() : constantPropId,
        kind: 'proposal-created',
      },
      network: 'aave',
      chain: 'dydx',
    },
    [SupportedNotificationChains.kyve]: {
      chain: 'kyve',
      network: 'cosmos',
      event_data: {
        kind: 'msg-submit-proposal',
        id: randomData ? String(randomInt()) : String(constantPropId),
        content: {
          typeUrl: '/cosmos.gov.v1beta1.TextProposal',
          value: '0a087631207469746c65120e7631206465736372697074696f6e',
        },
        submitTime: 1694015653,
        depositEndTime: 1694188453,
        votingStartTime: 1694015653,
        votingEndTime: 1694015743,
        finalTallyResult: { yes: '0', abstain: '0', no: '0', noWithVeto: '0' },
        totalDeposit: { ustake: '2000000' },
      },
    },
    [SupportedNotificationChains.osmosis]: {
      chain: 'osmosis',
      network: 'cosmos',
      event_data: {
        kind: 'msg-submit-proposal',
        id: randomData ? String(randomInt()) : String(constantPropId),
        content: {
          typeUrl: '/cosmos.gov.v1beta1.TextProposal',
          value:
            '0a0f626574612074657874207469746c651215626574612074657874206465736372697074696f6e',
        },
        submitTime: 1694015671,
        depositEndTime: 1694188471,
        votingStartTime: 1694015671,
        votingEndTime: 1694015761,
        finalTallyResult: { yes: '0', abstain: '0', no: '0', noWithVeto: '0' },
        totalDeposit: { ustake: '2000000' },
      },
    },
  };

  const constantStartTime = 987654321;
  const constantId = '0x123456789';

  const startTime = randomInt();
  const randomString = Array.from(
    { length: 64 },
    () =>
      'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)],
  ).join('');

  const snapshotNotifications = {
    [SupportedNotificationSpaces.stgdao]: {
      eventType: 'proposal/created',
      space: SupportedNotificationSpaces.stgdao,
      id: randomData ? `0x${randomString}` : constantId,
      title: 'Test Snapshot Proposal Title',
      body: 'Test snapshot proposal body',
      choices: ['Yes', 'No', 'Abstain'],
      start: randomData ? startTime : constantStartTime,
      expire: randomData ? startTime + 450_000 : constantStartTime + 450_000,
    },
  };

  if (chain) {
    return ceNotifications[chain];
  } else if (snapshot) {
    return snapshotNotifications[snapshot];
  } else {
    throw new Error('Must provide either a chain or snapshot space');
  }
}

async function getExistingNotifications(
  transaction: Transaction,
  chainId?: string,
  snapshotId?: string,
): Promise<NotificationInstance[]> {
  let existingNotifications: NotificationInstance[];
  if (chainId) {
    log.info(`Replacing a real notification for chain: ${chainId}`);
    existingNotifications = await models.Notification.findAll({
      where: {
        category_id: NotificationCategories.ChainEvent,
        community_id: chainId,
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
            `notification_data::jsonb ->> 'space' = '${snapshotId}'`,
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

async function setupNotification(
  transaction: Transaction,
  mockNotification: boolean,
  dontReplace: boolean,
  chainId?: string,
  snapshotId?: string,
): Promise<string> {
  if (!chainId && !snapshotId) {
    throw new Error('Must provide either a chainId or a snapshotId');
  }

  let existingNotifications: NotificationInstance[];
  if (mockNotification && chainId) {
    const mockNotif = getMockNotification(!dontReplace, chainId);
    // handles the case where a mock notification is emitted multiple times
    // this is necessary because chain-event notifications have a unique constraint on the id
    const existingCeMockNotif = await models.Notification.findAll({
      where: {
        category_id: NotificationCategories.ChainEvent,
        community_id: chainId,
        chain_event_id: mockNotif.id || null,
        [Sequelize.Op.and]: [
          Sequelize.literal(
            `notification_data::jsonb -> 'event_data' ->> 'id' = '${mockNotif.event_data.id}'`,
          ),
        ],
      },
      transaction,
    });

    if (existingCeMockNotif.length > 0 && !dontReplace) {
      existingNotifications = existingCeMockNotif;
    } else return JSON.stringify(mockNotif);
  } else if (mockNotification && snapshotId) {
    return JSON.stringify(
      getMockNotification(!dontReplace, undefined, snapshotId),
    );
  }

  if (!existingNotifications) {
    existingNotifications = await getExistingNotifications(
      transaction,
      chainId,
      snapshotId,
    );
  }

  if (existingNotifications.length === 0) {
    let msg: string;
    if (chainId) {
      msg =
        `No existing chain-event notification found for ${chainId}. ` +
        `Please use a chain id that has existing notifications e.g. dydx`;
    } else {
      msg =
        `No existing snapshot-proposal notification found for ${snapshotId}. ` +
        `Please use a snapshot id that has existing notifications e.g. stgdao.eth`;
    }
    throw new Error(msg);
  }

  const existingNotif = existingNotifications[0];

  if (!dontReplace) {
    log.info(`Replacing existing notification with id ${existingNotif.id}`);
    await models.NotificationsRead.destroy({
      where: {
        notification_id: existingNotif.id,
      },
      transaction,
    });
    await existingNotif.destroy({ transaction });
    log.info(`Deleted the existing notification and notifications read.`);
  }

  const newNotifData = existingNotif.toJSON();

  return newNotifData.notification_data;
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .options({
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
      dont_replace: {
        alias: 'd',
        type: 'boolean',
        default: false,
        description:
          'Whether to replace an existing notification if it is found or emit the same notification. This option' +
          'is especially useful to test duplicate emission of a notification.',
      },
    })
    // eslint-disable-next-line @typescript-eslint/no-shadow
    .check((argv) => {
      if (!argv.mock_notification) return true;

      if (argv.chain_id) {
        if (
          !Object.values(SupportedNotificationChains).includes(
            argv.chain_id as SupportedNotificationChains,
          )
        ) {
          throw new Error(
            `Chain id must be one of ${Object.values(
              SupportedNotificationChains,
            )}`,
          );
        }
      } else if (argv.snapshot_id) {
        if (
          !Object.values(SupportedNotificationSpaces).includes(
            argv.snapshot_id as SupportedNotificationSpaces,
          )
        ) {
          throw new Error(
            `Snapshot id must be one of ${Object.values(
              SupportedNotificationSpaces,
            )}`,
          );
        }
      }

      return true;
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
            'Make sure the given address is an address you have used to sign in before.',
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
          community_id: argv.chain_id,
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
      argv.dont_replace,
      argv.chain_id,
      argv.snapshot_id,
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
 *
 * If the mock (`-m`) option is used multiple times in succession, the same notification data will be re-emitted.
 * This may make it appear like no new notification has been created but closer inspection of the notification ID
 * will make it clear that a new notification was created with the same data. Additionally, emitting a non-mocked
 * notification means the script picks a random notification (with a matching chain ID or snapshot space). This means
 * if a mock notification was created first, we cannot guarantee that the non-mocked notification links to a real
 * chain event. Therefore, the default is to emit a non-mocked notification and a mocked notification should only be
 * used in rare circumstances such as in local testing when implementing a new chain event or snapshot notification
 * type.
 *
 * Example usage: `yarn emit-notification -c dydx -w [your-wallet-address]`. This finds a random old dydx
 * chain-event notification and re-emits it as if it were a brand new notification. Since it replaces an old
 * (but real) notification, it links to a real proposal.
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
