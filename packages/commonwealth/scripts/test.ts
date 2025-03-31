import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';

async function main() {
  const quest = await models.Quest.findOne({
    include: [
      {
        model: models.QuestActionMeta,
        as: 'action_metas',
        include: [
          {
            model: models.QuestTweets,
            required: false,
          },
        ],
      },
    ],
  });

  const discordCommunity = await models.Community.findOne({
    include: [
      {
        model: models.DiscordBotConfig,
        required: true,
      },
    ],
  });

  const discordConfig = await models.DiscordBotConfig.findOne({
    include: [
      {
        model: models.Community,
        required: true,
      },
    ],
  });

  console.log(
    `Quest: ${!!quest}, Discord Community: ${!!discordCommunity}, Discord Config: ${!!discordConfig}`,
  );
}

if (import.meta.url.endsWith(process.argv[1])) {
  main()
    .then(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('EXIT', true);
    })
    .catch((err) => {
      console.error(err);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('ERROR', true);
    });
}
