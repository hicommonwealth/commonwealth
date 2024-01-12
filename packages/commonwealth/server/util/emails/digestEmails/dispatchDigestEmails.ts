import {
  formatFilename,
  loggerFactory,
  RedisCache,
} from '@hicommonwealth/adapters';
import { RedisNamespaces } from '@hicommonwealth/core';
import { uuidv4 } from 'lib/util';
import { Op } from 'sequelize';
import models from '../../../database';
import { UserInstance } from '../../../models/user';
import { rollbar } from '../../rollbar';
import { sendEmails } from '../util';
import { createEmailObjects } from './createEmailObject';

const log = loggerFactory.getLogger(formatFilename(__filename));

type DigestEmailIntervals = 'daily' | 'weekly';

/**
 * This function creates and sends notification digest emails.
 * @param interval The type of digest email to send. Can be either 'daily' or 'weekly
 * @param userBatchEmailSize The number of users to batch together when sending emails. This value
 * should be smaller when interval = 'weekly' than when interval = 'daily because more notifications need to be
 * retrieved from the database to generate the emails.
 */
export async function dispatchDigestEmails(
  interval: DigestEmailIntervals,
  userBatchEmailSize: number,
  redisCache: RedisCache,
) {
  // check lock
  try {
    const lockAcquired = await redisCache.setKey(
      RedisNamespaces.Emails,
      interval,
      uuidv4(),
      interval ? 23.9 * 3600 : 24 * 7 - 10, // set ttl to 23.9 hrs or 6 days 23.9 hrs
      true,
    );

    if (lockAcquired != true) {
      log.info('Unable to acquire lock. Skipping email sending');
      return;
    }
  } catch (e) {
    const msg = 'An error occurred while attempting to acquire an email lock';
    log.error(msg, e);
    rollbar.error(msg, e);
  }

  // if lock is acquired batch fetch users
  let minUserId = 0;
  let users: UserInstance[] = [];
  do {
    users = await models.User.findAll({
      where: {
        emailNotificationInterval: interval,
        id: { [Op.gt]: minUserId },
      },
      limit: userBatchEmailSize,
      order: [['id', 'ASC']],
    });

    if (users.length === 0) return;

    minUserId = users[users.length - 1].id;

    const emails = await createEmailObjects(users);
    await sendEmails(emails);
  } while (users.length < userBatchEmailSize);
}
