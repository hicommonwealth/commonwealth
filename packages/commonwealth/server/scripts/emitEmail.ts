import { RedisCache } from '@hicommonwealth/adapters';
import {
  NotificationCategories,
  ProposalType,
  SupportedNetwork,
} from '@hicommonwealth/core';
import sgMail from '@sendgrid/mail';
import { Op } from 'sequelize';
import { NotificationDataAndCategory } from 'types';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { SENDGRID_API_KEY } from '../config';
import models from '../database';
import { SubscriptionAttributes } from '../models/subscription';
import { UserInstance } from '../models/user';
import { dispatchDigestEmails } from '../util/emails/digestEmails/dispatchDigestEmails';
import { dispatchImmediateEmails } from '../util/emails/immediateEmails/dispatchImmediateEmails';

sgMail.setApiKey(SENDGRID_API_KEY);

async function emitDigestEmail(user: UserInstance, argv: Record<string, any>) {
  await models.sequelize.transaction(async (transaction) => {
    await models.User.update(
      {
        emailNotificationInterval: argv.digestInterval,
      },
      {
        where: {
          id: user.id,
        },
        transaction,
      },
    );

    await models.User.update(
      {
        email: null,
        emailNotificationInterval: 'never',
      },
      {
        where: {
          id: {
            [Op.ne]: user.id,
          },
        },
        transaction,
      },
    );
  });

  const redisCache = {
    setKey: () => true,
  };
  await dispatchDigestEmails(
    argv.digestInterval,
    10,
    redisCache as unknown as RedisCache,
  );
}

async function emitImmediateEmail(
  user: UserInstance,
  argv: Record<string, any>,
) {
  const chain_id = 'dydx';

  const chain = await models.Community.findOne({
    where: {
      id: chain_id,
    },
  });

  const subData: SubscriptionAttributes = {
    id: 1,
    subscriber_id: user.id,
    category_id: argv.notificationCategory,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    immediate_email: true,
    chain_id,
  };

  let notification: NotificationDataAndCategory;
  if (argv.notificationCategory === NotificationCategories.ChainEvent) {
    notification = {
      categoryId: NotificationCategories.ChainEvent,
      data: {
        event_data: {
          id: 1,
          kind: 'proposal-created',
        },
        network: SupportedNetwork.Aave,
        chain: chain.id,
      },
    };
  } else {
    const thread = await models.Thread.findOne({
      where: {
        community_id: chain.id,
      },
      include: {
        model: models.Address,
        required: true,
        as: 'Address',
      },
    });

    const baseNotifData = {
      created_at: thread.created_at,
      thread_id: thread.id,
      root_title: thread.title,
      root_type: ProposalType.Thread,
      chain_id: thread.community_id,
      author_address: thread.Address.address,
      author_chain: thread.Address.community_id,
    };

    if (argv.notificationCategory === NotificationCategories.NewThread) {
      notification = {
        categoryId: NotificationCategories.NewThread,
        data: {
          ...baseNotifData,
          comment_text: thread.body,
        },
      };
    } else if (
      argv.notificationCategory === NotificationCategories.NewComment
    ) {
      const [comment, created] = await models.Comment.findOrCreate({
        where: {
          community_id: chain.id,
          thread_id: thread.id,
        },
        defaults: {
          address_id: thread.address_id,
          text: 'This is a comment',
        },
      });

      notification = {
        categoryId: NotificationCategories.NewComment,
        data: {
          ...baseNotifData,
          comment_text: comment.text,
          comment_id: comment.id,
        },
      };

      subData.thread_id = thread.id;
    } else if (
      argv.notificationCategory === NotificationCategories.NewReaction
    ) {
      const anotherAddress = await models.Address.findOne({
        where: {
          community_id: chain.id,
        },
      });
      await models.Reaction.findOrCreate({
        where: {
          community_id: chain.id,
          thread_id: thread.id,
          address_id: anotherAddress.id,
          reaction: 'like',
        },
      });

      notification = {
        categoryId: NotificationCategories.NewReaction,
        data: {
          ...baseNotifData,
        },
      };

      subData.thread_id = thread.id;
    }
  }

  const subscription = models.Subscription.build(subData);
  subscription.User = models.User.build({
    id: 1,
    email: argv.email,
    created_at: new Date(),
    updated_at: new Date(),
    emailVerified: false,
    selected_community_id: chain_id as unknown as number,
  });

  await dispatchImmediateEmails(notification, [subscription]);
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .options({
      type: {
        alias: 't',
        type: 'string',
        choices: ['immediate', 'digest'],
        default: 'immediate',
        description:
          'The type of email to send. Setting to digest will modify all existing users.',
        demandOption: true,
      },
      notificationCategory: {
        alias: 'c',
        type: 'string',
        description:
          'The category of the webhook notification to emit i.e. NotificationCategories',
        choices: [
          NotificationCategories.ChainEvent,
          NotificationCategories.NewThread,
          NotificationCategories.NewComment,
          NotificationCategories.NewReaction,
        ],
      },
      user_id: {
        alias: 'u',
        type: 'number',
        demandOption: false,
        description:
          'The user id of the user whose email should be set to the provided email',
      },
      email: {
        alias: 'e',
        type: 'string',
        description: 'The destination email.',
        demandOption: true,
      },
      digestInterval: {
        alias: 'd',
        type: 'string',
        choices: ['daily', 'weekly'],
        default: 'daily',
        description:
          'The interval (either daily or weekly) of the digest email to send',
      },
    })
    .check((args) => {
      if (args.type === 'immediate' && !args.notificationCategory) {
        throw new Error(
          'Must provide a notification category if sending an immediate email!',
        );
      }
      return true;
    }).argv;

  let user = await models.User.findOne({
    where: {
      email: argv.email,
    },
  });

  if (!user && !argv.user_id) {
    throw new Error(
      `Must provide a user id to assign the ${argv.email} email to!`,
    );
  } else if (!user && argv.user_id) {
    await models.User.update(
      {
        email: argv.email,
      },
      {
        where: {
          id: argv.user_id,
        },
      },
    );
    user = await models.User.findOne({
      where: {
        id: argv.user_id,
      },
    });
  }

  if (argv.type === 'immediate') {
    await emitImmediateEmail(user, argv);
  } else {
    await emitDigestEmail(user, argv);
  }
}

if (require.main === module) {
  main()
    .then(() => {
      // note this stops rollbar errors reports from completing in the `dispatchWebhooks` function
      process.exit(0);
    })
    .catch((err) => {
      console.log('Failed to emit a notification:', err);
      process.exit(1);
    });
}
