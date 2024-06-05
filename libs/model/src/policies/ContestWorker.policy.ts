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

        const activeContestsWithoutContent = await models.sequelize.query<{
          url: string;
          private_url: string;
          contest_address: string;
        }>(
          `
          SELECT cn.url, cn.private_url, cm.contest_address
          FROM "Communities" c
          JOIN "ChainNodes" cn ON c.chain_node_id = cn.id
          JOIN "ContestManagers" cm ON cm.community_id = c.id
          JOIN "ContestTopics" ct ON cm.contest_address = ct.contest_address
          JOIN "Contests" co ON cm.contest_address = co.contest_address
          LEFT JOIN "ContestActions" ca ON co.contest_address = ca.contest_address
              AND co.contest_id = ca.contest_id
              AND ca.content_url = :content_url
              AND ca.actor_address = :actor_address
              AND ca.action = 'added'
          WHERE ct.topic_id = :topic_id
          AND cm.community_id = :community_id
          AND cm.cancelled = false
          AND co.start_time < NOW()
          AND co.end_time > NOW()
          AND ca.action IS NULL;
        `,
          {
            type: QueryTypes.SELECT,
            replacements: {
              content_url: contentUrl,
              actor_address: userAddress,
              topic_id: payload.topic_id!,
              community_id: payload.community_id,
            },
          },
        );

        if (!activeContestsWithoutContent?.length) {
          log.warn(
            'ThreadCreated: no matching active contests without actions',
          );
          return;
        }

        const chainNodeUrl =
          activeContestsWithoutContent[0]!.private_url ||
          activeContestsWithoutContent[0]!.url;

        const addressesToProcess = activeContestsWithoutContent.map(
          (c) => c.contest_address,
        );

        const promises = await contestHelper.addContentBatch(
          chainNodeUrl!,
          addressesToProcess,
          userAddress,
          contentUrl,
        );

        const results = await Promise.allSettled(promises);

        const errors = results
          .filter(({ status }) => status === 'rejected')
          .map(
            (result) =>
              (result as PromiseRejectedResult).reason || '<unknown reason>',
          );

        if (errors.length > 0) {
          throw new Error(
            `addContent failed ${errors.length} times: ${errors.join(', ')}"`,
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

        const activeContestsWithoutVote = await models.sequelize.query<{
          url: string;
          private_url: string;
          contest_address: string;
          content_id: number;
        }>(
          `
            SELECT cn.url, cn.private_url, cm.contest_address, added.content_id
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
            AND co.start_time < NOW()
            AND co.end_time > NOW()
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

        if (!activeContestsWithoutVote?.length) {
          // throw to trigger retry in case the content is pending creation
          throw new Error(
            'ThreadUpvoted: no matching active contests without actions',
          );
        }

        const chainNodeUrl =
          activeContestsWithoutVote[0]!.private_url ||
          activeContestsWithoutVote[0]!.url;

        const addressesToProcess = activeContestsWithoutVote.map(
          (c) => c.contest_address,
        );

        log.debug(
          `ThreadUpvoted addressesToProcess: ${addressesToProcess.join(', ')}`,
        );

        const promises = await contestHelper.voteContentBatch(
          chainNodeUrl!,
          addressesToProcess,
          userAddress,
          activeContestsWithoutVote[0].content_id.toString(),
        );

        const results = await Promise.allSettled(promises);

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
