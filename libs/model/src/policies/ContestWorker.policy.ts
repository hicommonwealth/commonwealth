import { events, logger, Policy } from '@hicommonwealth/core';
import { Op, QueryTypes } from 'sequelize';
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

        const activeContestsWithoutActions = await models.sequelize.query<{
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

        if (!activeContestsWithoutActions?.length) {
          log.warn(
            'ThreadCreated: no matching active contests without actions',
          );
          return;
        }

        const chainNodeUrl =
          activeContestsWithoutActions[0]!.private_url ||
          activeContestsWithoutActions[0]!.url;

        const addressesToProcess = activeContestsWithoutActions.map(
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
        const contestTopics = await models.ContestTopic.findAll({
          where: {
            topic_id: topic_id,
          },
        });
        if (contestTopics.length === 0) {
          log.warn('ThreadUpvoted: no matching contest topics');
          return;
        }

        const community = await models.Community.findByPk(
          payload.community_id,
          {
            include: [
              {
                model: models.ChainNode.scope('withPrivateData'),
                required: false,
              },
              {
                model: models.ContestManager,
                as: 'contest_managers',
              },
            ],
          },
        );
        const chainNodeUrl =
          community?.ChainNode?.private_url || community?.ChainNode?.url;

        const contentUrl = buildThreadContentUrl(
          community!.id!,
          payload.thread_id!,
        );

        const contestAddresses = community!
          .contest_managers!.filter((c) => !c.cancelled) // must be active
          .filter((c) =>
            contestTopics.find(
              (ct) => ct.contest_address === c.contest_address,
            ),
          ) // must have an associated contest topic
          .map((c) => c.contest_address);

        const addAction = await models.ContestAction.findOne({
          where: {
            content_url: contentUrl,
            contest_address: {
              [Op.in]: contestAddresses,
            },
            action: 'added',
          },
        });

        // add upvotes on the content only if not already added
        const existingVoteActions = await models.ContestAction.findAll({
          where: {
            content_id: addAction!.content_id,
            contest_address: {
              [Op.in]: contestAddresses,
            },
            action: 'upvoted',
          },
        });

        const processedContestAddresses = existingVoteActions.map(
          (action) => action.contest_address,
        );
        const unprocessedContestAddresses = contestAddresses.filter(
          (a) => !processedContestAddresses.includes(a),
        );
        if (unprocessedContestAddresses.length === 0) {
          log.warn('ThreadUpvoted: no contest addresses to process');
          return;
        }

        const userAddress = addAction!.actor_address!;
        const contentId = addAction!.content_id!;

        const promises = await contestHelper.voteContentBatch(
          chainNodeUrl!,
          unprocessedContestAddresses,
          userAddress,
          contentId.toString(),
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
