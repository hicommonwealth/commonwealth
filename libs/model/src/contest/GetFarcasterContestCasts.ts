import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { BulkCastsSortType, NeynarAPIClient } from '@neynar/nodejs-sdk';
import { config } from '../config';
import { models } from '../database';
import { mustExist } from '../middleware/guards';

export function GetFarcasterContestCasts(): Query<
  typeof schemas.GetFarcasterContestCasts
> {
  return {
    ...schemas.GetFarcasterContestCasts,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const contestManager = await models.ContestManager.findOne({
        where: {
          contest_address: payload.contest_address,
        },
      });
      mustExist('Contest Manager', contestManager);
      if (!contestManager.farcaster_frame_hashes?.length) {
        return [];
      }
      const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);
      const frames = await client.fetchBulkCasts(
        contestManager.farcaster_frame_hashes,
        {
          sortType: BulkCastsSortType.LIKES,
        },
      );
      return frames.result.casts;
    },
  };
}
