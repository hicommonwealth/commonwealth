import { Actor, events, logger, Policy } from '@hicommonwealth/core';
import { QueryTypes } from 'sequelize';
import { Contest, models } from '..';
import { buildThreadContentUrl, getChainNodeUrl } from '../utils';
import {
  createOnchainContestContent,
  createOnchainContestVote,
} from './contest-utils';

const log = logger(import.meta);

const inputs = {
  ThreadCreated: events.ThreadCreated,
  ThreadUpvoted: events.ThreadUpvoted,
};

export function ContestWorker(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      ThreadCreated: async ({ payload }) => {
        const content_url = buildThreadContentUrl(
          payload.community_id,
          payload.id!,
        );

        const activeContestManagers =
          await Contest.GetActiveContestManagers().body({
            actor: {} as Actor,
            payload: {
              community_id: payload.community_id!,
              topic_id: payload.topic_id!,
            },
          });
        if (!activeContestManagers?.length) {
          log.warn('ThreadCreated: no matching contest managers found');
          return;
        }

        await createOnchainContestContent({
          contestManagers: activeContestManagers,
          bypass_quota: false,
          content_url,
          author_address: payload.address!,
        });
      },
      ThreadUpvoted: async ({ payload }) => {
        const content_url = buildThreadContentUrl(
          payload.community_id,
          payload.thread_id,
        );

        const activeContestManagersWithoutVote = await models.sequelize.query<{
          url: string;
          private_url: string;
          contest_address: string;
          content_id: number;
        }>(
          `
            SELECT cn.private_url, cn.url, cm.contest_address, added.content_id
            FROM "Communities" c
            JOIN "ChainNodes" cn ON c.chain_node_id = cn.id
            JOIN "ContestManagers" cm ON cm.community_id = c.id
            JOIN "Contests" co ON cm.contest_address = co.contest_address
              AND co.contest_id = (
                SELECT MAX(contest_id) AS max_id
                FROM "Contests" c1
                WHERE c1.contest_address = cm.contest_address
              )
            JOIN "ContestActions" added on co.contest_address = added.contest_address
              AND added.content_url = :content_url
              AND added.action = 'added'
            WHERE cm.topic_id = :topic_id
            AND cm.community_id = :community_id
            AND cm.cancelled = false
            AND (
              cm.interval = 0 AND NOW() < co.end_time
              OR
              cm.interval > 0
            )
          -- content cannot be a winner in a previous contest
          AND NOT EXISTS (
            WITH max_contest AS (
              SELECT MAX(contest_id) AS max_id
              FROM "Contests" c1
              WHERE c1.contest_address = cm.contest_address
            )
            SELECT c2.score
            FROM "Contests" c2,
                jsonb_array_elements(c2.score) AS score_result
            WHERE
                c2.contest_address = cm.contest_address AND
                (score_result->>'content_id')::int = added.content_id::int AND
                (score_result->>'prize')::float > 0 AND
                c2.contest_id != (SELECT max_id FROM max_contest)
          )
        `,
          {
            type: QueryTypes.SELECT,
            replacements: {
              content_url: content_url,
              actor_address: payload.address,
              topic_id: payload.topic_id,
              community_id: payload.community_id,
            },
          },
        );
        if (!activeContestManagersWithoutVote?.length) {
          // throw to trigger retry in case the content is pending creation
          throw new Error(
            'ThreadUpvoted: no matching active contests without actions',
          );
        }

        const chainNodeUrl = getChainNodeUrl(
          activeContestManagersWithoutVote[0]!,
        );

        await createOnchainContestVote({
          contestManagers: activeContestManagersWithoutVote.map(
            ({ contest_address, content_id }) => ({
              url: chainNodeUrl,
              contest_address,
              content_id,
            }),
          ),
          content_url,
          author_address: payload.address!,
        });
      },
    },
  };
}
