import { logger, Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { models } from '../database';
import { mustExist } from '../middleware';
import { getVotingWeight } from '../services/stakeHelper';

const log = logger(import.meta);

const inputs = {
  RefreshWeightedVotesRequested: events.RefreshWeightedVotesRequested,
};

async function* paginateThreads(
  topicId: number,
  communityId: string,
  pageSize = 100,
) {
  let offset = 0;

  while (true) {
    const threads = await models.Thread.findAll({
      where: {
        topic_id: topicId,
        community_id: communityId,
        deleted_at: null,
      },
      limit: pageSize,
      offset,
      order: [['id', 'ASC']],
    });

    if (threads.length === 0) break;

    yield* threads;
    offset += pageSize;

    if (threads.length < pageSize) break;
  }
}

async function* paginateReactions(
  targetId: number,
  targetType: 'thread' | 'comment',
  pageSize = 100,
) {
  let offset = 0;

  while (true) {
    const whereClause =
      targetType === 'thread'
        ? { thread_id: targetId }
        : { comment_id: targetId };

    const reactions = await models.Reaction.findAll({
      where: whereClause,
      include: [
        {
          model: models.Address,
          required: true,
        },
      ],
      limit: pageSize,
      offset,
      order: [['id', 'ASC']],
    });

    if (reactions.length === 0) break;

    yield* reactions;
    offset += pageSize;

    if (reactions.length < pageSize) break;
  }
}

async function* paginateComments(
  topicId: number,
  communityId: string,
  pageSize = 100,
) {
  let offset = 0;

  while (true) {
    const comments = await models.Comment.findAll({
      include: [
        {
          model: models.Thread,
          required: true,
          where: {
            topic_id: topicId,
            community_id: communityId,
            deleted_at: null,
          },
        },
      ],
      where: {
        deleted_at: null,
      },
      limit: pageSize,
      offset,
      order: [['id', 'ASC']],
    });

    if (comments.length === 0) break;

    yield* comments;
    offset += pageSize;

    if (comments.length < pageSize) break;
  }
}

// Process a single reaction and return its calculated weight
async function processSingleReaction(
  reaction: any,
  topicId: number,
): Promise<bigint> {
  try {
    const calculatedWeight = await getVotingWeight(
      topicId,
      reaction.Address!.address,
    );

    console.log('processed reaction', {
      reactionId: reaction.id,
      calculatedWeight,
    });

    await reaction.update({
      calculated_voting_weight: calculatedWeight?.toString() || '0',
    });

    return BigInt(calculatedWeight?.toString() || '0');
  } catch (error) {
    log.warn(
      `Failed to recalculate voting weight for reaction ${reaction.id}: ${error}`,
    );

    await reaction.update({
      calculated_voting_weight: '0',
    });

    return BigInt(0);
  }
}

export function ReactionWorker(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      RefreshWeightedVotesRequested: async ({ payload }) => {
        const { topic_id, community_id } = payload;

        const topic = await models.Topic.findOne({
          where: { id: topic_id, community_id },
        });
        mustExist('Topic', topic);

        log.info(
          `Starting weighted votes refresh for topic ${topic_id} in community ${community_id}`,
        );

        let threadsProcessed = 0;
        let commentsProcessed = 0;
        let reactionsProcessed = 0;

        for await (const thread of paginateThreads(topic_id, community_id)) {
          let totalReactionWeight = BigInt(0);

          for await (const reaction of paginateReactions(
            thread.id!,
            'thread',
          )) {
            const reactionWeight = await processSingleReaction(
              reaction,
              topic_id,
            );
            totalReactionWeight += reactionWeight;
            reactionsProcessed++;
          }

          await thread.update({
            reaction_weights_sum: totalReactionWeight.toString(),
          });

          threadsProcessed++;
        }

        for await (const comment of paginateComments(topic_id, community_id)) {
          let totalReactionWeight = BigInt(0);

          for await (const reaction of paginateReactions(
            comment.id!,
            'comment',
          )) {
            const reactionWeight = await processSingleReaction(
              reaction,
              topic_id,
            );
            totalReactionWeight += reactionWeight;
            reactionsProcessed++;
          }

          await comment.update({
            reaction_weights_sum: totalReactionWeight.toString(),
          });

          commentsProcessed++;
        }

        log.info(
          `Completed weighted votes refresh for topic ${topic_id}: ` +
            `${threadsProcessed} threads, ${commentsProcessed} comments, ${reactionsProcessed} reactions processed`,
        );
      },
    },
  };
}
