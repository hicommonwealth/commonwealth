import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { NotificationCategories, ProposalType } from 'common-common/src/types';
import { NotificationDataAndCategory } from 'types';
import { dispatchWebhooks } from '../util/webhooks/dispatchWebhook';
import { SupportedNetwork } from 'chain-events/src';
import models from '../database';
import { WebhookDestinations } from '../util/webhooks/types';

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .options({
      notificationCategory: {
        alias: 'c',
        type: 'string',
        description:
          'The category of the webhook notification to emit i.e. NotificationCategories',
        choices: Object.values(NotificationCategories),
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
        choices: Object.values(WebhookDestinations),
        description:
          'The destination of the webhook notification. ' +
          'This sends a notification to a hardcoded channel.' +
          'See Webhooks.md in the Wiki for more information about existing testing channels.',
      },
      // eslint-disable-next-line @typescript-eslint/no-shadow
    })
    .check((argv) => {
      if (!argv.url && !argv.destination) {
        throw new Error(
          'Must provide either a webhook url or a destination flag.'
        );
      }

      if (argv) return true;
    })
    .coerce('destination', (arg) => {
      // TODO: map destination to an env var url
      return arg;
      // if (arg === WebhookDestinations.Discord) {
      //   return process.env.DISCORD_WEBHOOK_URL;
      // } else if (arg === WebhookDestinations.Slack) {
      //   return process.env.SLACK_WEBHOOK_URL;
      // } else if (arg === WebhookDestinations.Telegram) {
      //   return process.env.TELEGRAM_BOT_TOKEN;
      // } else {
      //   throw new Error(`Invalid webhook destination: ${arg}`);
      // }
    }).argv;

  const chain = await models.Chain.findOne({
    where: {
      id: 'dydx',
    },
  });

  const [webhook, created] = await models.Webhook.findOrCreate({
    where: {
      url: argv.url,
      chain_id: chain.id,
    },
    defaults: {
      categories: [argv.notificationCategory],
    },
  });

  if (!created) {
    webhook.categories = [argv.notificationCategory];
    await webhook.save();
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
        chain: chain.id,
      },
    };
  } else if (argv.notificationCategory === NotificationCategories.NewThread) {
    const thread = await models.Thread.findOne({
      where: {
        chain: chain.id,
      },
      include: {
        model: models.Address,
        required: true,
        as: 'Address',
      },
    });
    notification = {
      categoryId: NotificationCategories.NewThread,
      data: {
        created_at: thread.created_at,
        thread_id: thread.id,
        root_title: thread.title,
        root_type: ProposalType.Thread,
        chain_id: thread.chain,
        author_address: thread.Address.address,
        author_chain: thread.Address.chain,
        comment_text: thread.body,
      },
    };
  }

  await dispatchWebhooks(notification, [webhook]);
}

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
