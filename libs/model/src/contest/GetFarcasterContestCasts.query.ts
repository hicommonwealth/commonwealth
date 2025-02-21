import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { QueryTypes } from 'sequelize';
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
      const contents = await models.sequelize.query<{
        contest_address: string;
        contest_id: number;
        content_id: number;
        actor_address: string;
        added_action: 'added';
        content_url: string;
        voting_weights_sum: number;
      }>(
        `
        SELECT
            ca1.contest_address,
            ca1.contest_id,
            ca1.content_id,
            ca1.actor_address,
            ca1.action AS added_action,
            ca1.content_url,
            (FLOOR(SUM(ca2.voting_power / 10^cm.decimals))) AS voting_weights_sum
        FROM
            "ContestActions" ca1
        LEFT JOIN
            "ContestActions" ca2
            ON ca1.contest_address = ca2.contest_address
            AND ca1.contest_id = ca2.contest_id
            AND ca1.content_id = ca2.content_id
            AND ca2.action = 'upvoted'
        JOIN "ContestManagers" cm
            ON ca1.contest_address = cm.contest_address
        WHERE
            ca1.action = 'added'
            AND ca1.contest_address = :contest_address
            AND ca1.contest_id = :contest_id
        GROUP BY
            ca1.contest_address,
            ca1.contest_id,
            ca1.content_id,
            ca1.actor_address,
            ca1.action,
            cm.decimals
        ORDER BY
            ca1.contest_address,
            ca1.contest_id,
            ca1.content_id;
      `,
        {
          replacements: {
            contest_address: payload.contest_address,
            contest_id: 0, // only support one-off contests for now
          },
          type: QueryTypes.SELECT,
        },
      );
      if (!contents.length) {
        return [];
      }

      const replyCastHashes = contents.map((action) => {
        /*
          /farcaster/0x123/0x234
        */
        const [, , , replyCastHash] = action.content_url!.split('/');
        return replyCastHash;
      });
      const frameHashesToFetch = [...replyCastHashes];
      const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);
      const castsResponse = await client.fetchBulkCasts(frameHashesToFetch);

      const { casts } = castsResponse.result;

      const replyVoteSums = contents.reduce(
        (acc, content) => {
          const [, , , replyCastHash] = content.content_url!.split('/');
          return {
            ...acc,
            [replyCastHash]: content.voting_weights_sum || 0,
          };
        },
        {} as Record<string, number>,
      );

      return casts
        .map((cast) => ({
          ...cast,
          calculated_vote_weight: replyVoteSums[cast.hash],
        }))
        .sort((a, b) => {
          if (payload.sort_by === 'upvotes') {
            return b.calculated_vote_weight - a.calculated_vote_weight;
          }
          return (
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        });
    },
  };
}
