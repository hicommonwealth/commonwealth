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
            WHERE ct.topic_id = :topic_id
            AND cm.community_id = :community_id
            AND cm.cancelled = false
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
          log.warn('ThreadCreated: no contest managers found');
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
            JOIN "ContestActions" added on co.contest_address = added.contest_address
              AND co.contest_id = added.contest_id
              AND added.thread_id = :thread_id
              AND added.action = 'added'
            LEFT JOIN "ContestActions" ca ON co.contest_address = ca.contest_address
              AND co.contest_id = ca.contest_id
              AND ca.thread_id = :thread_id
              AND ca.actor_address = :actor_address
              AND ca.action = 'upvoted'
            WHERE ct.topic_id = :topic_id
            AND cm.community_id = :community_id
            AND cm.cancelled = false
            AND NOW() > co.start_time
            AND ca.action IS NULL;
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
