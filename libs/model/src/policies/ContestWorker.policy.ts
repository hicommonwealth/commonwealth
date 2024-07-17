import { events, logger, Policy } from '@hicommonwealth/core';
import { QueryTypes } from 'sequelize';
import { fileURLToPath } from 'url';
import { models } from '../database';
import { contestHelper } from '../services/commonProtocol';
import { buildThreadContentUrl } from '../utils';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

const inputs = {
  ThreadCreated: events.ThreadCreated,
  ThreadUpvoted: events.ThreadUpvoted,
};

export function ContestWorker(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      ThreadCreated: async ({ payload }) => {
        if (!payload.topic_id) {
          log.warn('ThreadCreated: payload does not contain topic_id');
          return;
        }

        const { address: userAddress } = (await models.Address.findByPk(
          payload!.address_id,
        ))!;

        const contentUrl = buildThreadContentUrl(
          payload.community_id!,
          payload.id!,
        );

        const activeContestManagers = await models.sequelize.query<{
          contest_address: string;
          url: string;
          private_url: string;
        }>(
          `
            SELECT COALESCE(cn.private_url, cn.url) as url, cm.contest_address
            FROM "Communities" c
            JOIN "ChainNodes" cn ON c.chain_node_id = cn.id
            JOIN "ContestManagers" cm ON cm.community_id = c.id
            JOIN "ContestTopics" ct ON cm.contest_address = ct.contest_address
            JOIN (
                SELECT contest_address, MAX(contest_id) AS max_contest_id, MAX(end_time) as end_time
                FROM "Contests"
                GROUP BY contest_address
            ) co ON cm.contest_address = co.contest_address
            WHERE ct.topic_id = :topic_id
            AND cm.community_id = :community_id
            AND cm.cancelled = false
            AND (
              cm.interval = 0 AND NOW() < co.end_time
              OR
              cm.interval > 0
            )
        `,
          {
            type: QueryTypes.SELECT,
            replacements: {
              topic_id: payload.topic_id!,
              community_id: payload.community_id,
            },
          },
        );

        if (!activeContestManagers?.length) {
          log.warn('ThreadCreated: no matching contest managers found');
          return;
        }

        const chainNodeUrl = activeContestManagers[0]!.url;

        const addressesToProcess = activeContestManagers.map(
          (c) => c.contest_address,
        );

        log.debug(
          `ThreadCreated: addresses to process: ${JSON.stringify(
            addressesToProcess,
            null,
            2,
          )}`,
        );

        const results = await contestHelper.addContentBatch(
          chainNodeUrl!,
          addressesToProcess,
          userAddress,
          contentUrl,
        );

        const errors = results
          .filter(({ status }) => status === 'rejected')
          .map(
            (result) =>
              (result as PromiseRejectedResult).reason || '<unknown reason>',
          );

        if (errors.length > 0) {
          // TODO: ignore duplicate content error
          throw new Error(
            `addContent failed with errors: ${errors.join(', ')}"`,
          );
        }
      },
      ThreadUpvoted: async ({ payload }) => {
        const { topic_id } = (await models.Thread.findByPk(payload.thread_id!, {
          attributes: ['topic_id'],
        }))!;
        if (!topic_id) {
          log.warn('ThreadUpvoted: thread does not contain topic_id');
          return;
        }

        const { address: userAddress } = (await models.Address.findByPk(
          payload!.address_id,
        ))!;

        const activeContestManagersWithoutVote = await models.sequelize.query<{
          url: string;
          private_url: string;
          contest_address: string;
          content_id: number;
        }>(
          `
            SELECT coalesce(cn.private_url, cn.url) as url, cm.contest_address, added.content_id
            FROM "Communities" c
            JOIN "ChainNodes" cn ON c.chain_node_id = cn.id
            JOIN "ContestManagers" cm ON cm.community_id = c.id
            JOIN "ContestTopics" ct ON cm.contest_address = ct.contest_address
            JOIN "Contests" co ON cm.contest_address = co.contest_address
              AND co.contest_id = (
                SELECT MAX(contest_id) AS max_id
                FROM "Contests" c1
                WHERE c1.contest_address = cm.contest_address
              )
            JOIN "ContestActions" added on co.contest_address = added.contest_address
              AND added.thread_id = :thread_id
              AND added.action = 'added'
            WHERE ct.topic_id = :topic_id
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
              thread_id: payload.thread_id!,
              actor_address: userAddress,
              topic_id: topic_id,
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

        const chainNodeUrl = activeContestManagersWithoutVote[0]!.url;

        log.debug(
          `ThreadUpvoted: contest managers to process: ${JSON.stringify(
            activeContestManagersWithoutVote,
            null,
            2,
          )}`,
        );

        const results = await contestHelper.voteContentBatch(
          chainNodeUrl!,
          userAddress,
          activeContestManagersWithoutVote.map((m) => ({
            contestAddress: m.contest_address,
            contentId: m.content_id.toString(),
          })),
        );

        const errors = results
          .filter(({ status }) => status === 'rejected')
          .map(
            (result) =>
              (result as PromiseRejectedResult).reason || '<unknown reason>',
          );

        if (errors.length > 0) {
          throw new Error(
            `voteContent failed ${errors.length} times: ${errors.join(', ')}"`,
          );
        }
      },
    },
  };
}
