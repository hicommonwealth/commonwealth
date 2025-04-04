import { dispose, handleEvent } from '@hicommonwealth/core';
import { TwitterEngagementPolicy } from '@hicommonwealth/model';

async function main() {
  // const tweetId = '1906530981198086394';
  const policy = TwitterEngagementPolicy();
  const event = {
    name: 'TweetEngagementCapReached' as const,
    payload: { quest_id: 5, quest_ended: false, like_cap_reached: true },
  };

  const res = await handleEvent(policy, event);

  console.log('\n\nSuccess Res: ', res);
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
