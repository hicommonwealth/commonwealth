import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { BulkCastsSortType, NeynarAPIClient } from '@neynar/nodejs-sdk';
import lo from 'lodash';
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
      const parentCastHashes = contestManager.farcaster_frame_hashes || [];
      const actions = await models.ContestAction.findAll({
        where: {
          contest_address: payload.contest_address,
          action: 'added',
        },
      });
      const replyCastHashes = actions.map((action) => {
        /*
          /farcaster/0x123/0x234
        */
        const [, , , replyCastHash] = action.content_url!.split('/');
        return replyCastHash;
      });
      const frameHashesToFetch = [...parentCastHashes, ...replyCastHashes];
      const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);
      const castsResponse = await client.fetchBulkCasts(frameHashesToFetch, {
        sortType:
          payload.sort_by === 'likes'
            ? BulkCastsSortType.LIKES
            : BulkCastsSortType.RECENT,
      });

      const { casts } = castsResponse.result;

      const replyCasts = lo.groupBy(casts, (cast) => {
        return cast.parent_hash;
      });

      const parentCasts = casts
        .filter((cast) => parentCastHashes.includes(cast.hash))
        .map((cast) => ({
          ...cast,
          replies: replyCasts[cast.hash],
        }));

      return parentCasts;
    },
  };
}
