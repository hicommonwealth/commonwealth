import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { TwitterBotName } from '@hicommonwealth/shared';

async function main() {
  const res = await models.TwitterCursor.create({
    bot_name: TwitterBotName.ContestBot,
    last_polled_timestamp: BigInt(new Date().getTime()),
  });

  console.log(res.toJSON());
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
