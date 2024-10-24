import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { config } from '../config';

export function GetFarcasterUpvoteActionMetadata(): Query<
  typeof schemas.GetFarcasterUpvoteActionMetadata
> {
  return {
    ...schemas.GetFarcasterUpvoteActionMetadata,
    auth: [],
    secure: false,
    body: async () => {
      return await Promise.resolve({
        name: 'Upvote Content',
        icon: 'thumbsup',
        description: 'Upvote content on a Commonwealth contest',
        aboutUrl: 'https://commonwealth.xyz',
        action: {
          type: 'post',
          postUrl: config.CONTESTS.FARCASTER_ACTION_URL!,
        },
      });
    },
  };
}
