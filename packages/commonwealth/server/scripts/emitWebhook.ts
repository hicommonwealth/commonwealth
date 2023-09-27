import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { NotificationCategories, ProposalType } from 'common-common/src/types';
import { NotificationDataAndCategory } from 'types';
import { dispatchWebhooks } from '../util/webhooks/dispatchWebhook';
import { SupportedNetwork } from 'chain-events/src';
import models from '../database';

async function main() {
  const argv = await yargs(hideBin(process.argv)).options({
    notificationCategory: {
      alias: 'c',
      type: 'string',
      description: 'The category of the webhook notification to emit.',
      choices: Object.values(NotificationCategories),
      demandOption: true,
    },
    url: {
      alias: 'u',
      type: 'string',
      description: 'The webhook url to emit the notification to.',
      demandOption: true,
    },
  }).argv;

  const chain = await models.Chain.findOne({
    where: {
      id: 'aave',
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

  await dispatchWebhooks(notification);
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
