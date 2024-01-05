import {
  NotificationCategories,
  ProposalType,
  SupportedNetwork,
} from '@hicommonwealth/core';
import { NotificationDataAndCategory, WebhookCategory } from 'types';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import models from '../database';
import { WebhookInstance } from '../models/webhook';
import { dispatchWebhooks } from '../util/webhooks/dispatchWebhook';
import { WebhookDestinations } from '../util/webhooks/types';

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .options({
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
        ] as WebhookCategory[],
        demandOption: true,
      },
      url: {
        alias: 'u',
        type: 'string',
        description:
          'A custom webhook url to emit the notification to. Overrides the destination flag.',
      },
      destination: {
        alias: 'd',
        type: 'string',
        choices: [...Object.values(WebhookDestinations), 'all'],
        description:
          'The destination of the webhook notification. ' +
          'This sends a notification to a hardcoded channel. ' +
          'See Webhooks.md in the Wiki for more information about existing testing channels.',
      },
    })
    .check((args) => {
      if (!args.url && !args.destination) {
        throw new Error(
          'Must provide either a webhook url or a destination flag.',
        );
      }
      return true;
    }).argv;

  if (
    !argv.url &&
    (!process.env.DISCORD_WEBHOOK_URL_DEV ||
      !process.env.SLACK_WEBHOOK_URL_DEV ||
      !process.env.ZAPIER_WEBHOOK_URL_DEV ||
      !process.env.TELEGRAM_BOT_TOKEN_DEV)
  ) {
    throw new Error(
      'Must have DISCORD_WEBHOOK_URL_DEV, SLACK_WEBHOOK_URL_DEV, ' +
        'ZAPIER_WEBHOOK_URL_DEV, and TELEGRAM_BOT_TOKEN_DEV set in .env',
    );
  }

  const community = await models.Community.findOne({
    where: {
      id: 'dydx',
    },
  });

  let url: string;
  const webhooks: WebhookInstance[] = [];
  const genericWebhookOptions = {
    community_id: community.id,
    categories: [argv.notificationCategory],
  };
  if (argv.url) {
    url = argv.url;
  } else if (argv.destination === WebhookDestinations.Discord) {
    url = process.env.DISCORD_WEBHOOK_URL_DEV;
  } else if (argv.destination === WebhookDestinations.Slack) {
    url = process.env.SLACK_WEBHOOK_URL_DEV;
  } else if (argv.destination === WebhookDestinations.Telegram) {
    url = 'api.telegram.org/@-1001509073772';
  } else if (argv.destination === WebhookDestinations.Zapier) {
    url = process.env.ZAPIER_WEBHOOK_URL_DEV;
  } else if (argv.destination === 'all') {
    webhooks.push(
      models.Webhook.build({
        url: process.env.DISCORD_WEBHOOK_URL_DEV,
        ...genericWebhookOptions,
      }),
      models.Webhook.build({
        url: process.env.SLACK_WEBHOOK_URL_DEV,
        ...genericWebhookOptions,
      }),
      models.Webhook.build({
        url: 'api.telegram.org/@-1001509073772',
        ...genericWebhookOptions,
      }),
      models.Webhook.build({
        url: process.env.ZAPIER_WEBHOOK_URL_DEV,
        ...genericWebhookOptions,
      }),
    );
  } else {
    throw new Error(`Invalid webhook destination: ${argv.destination}`);
  }

  if (webhooks.length === 0) {
    webhooks.push(
      models.Webhook.build({
        url,
        ...genericWebhookOptions,
      }),
    );
  }

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
        chain: community.id,
      },
    };
  } else {
    const thread = await models.Thread.findOne({
      where: {
        community_id: community.id,
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
      const [comment] = await models.Comment.findOrCreate({
        where: {
          chain: community.id,
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
    } else if (
      argv.notificationCategory === NotificationCategories.NewReaction
    ) {
      const anotherAddress = await models.Address.findOne({
        where: {
          community_id: community.id,
        },
      });
      await models.Reaction.findOrCreate({
        where: {
          community_id: community.id,
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
    }
  }

  await dispatchWebhooks(notification, webhooks);
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
