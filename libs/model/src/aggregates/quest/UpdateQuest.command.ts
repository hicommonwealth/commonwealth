import {
  Command,
  InvalidInput,
  InvalidState,
  logger,
} from '@hicommonwealth/core';
import { verifyEventSource } from '@hicommonwealth/evm-protocols';
import * as schemas from '@hicommonwealth/schemas';
import { Transaction } from 'sequelize';
import { toEventHash } from 'viem';
import { z } from 'zod/v4';
import { config } from '../../config';
import { models } from '../../database';
import {
  isSuperAdmin,
  mustBeValidDateRange,
  mustExist,
  mustNotBeStarted,
  mustNotExist,
} from '../../middleware';
import { QuestInstance } from '../../models/quest';
import {
  GraphileTaskNames,
  removeJob,
  scheduleTask,
} from '../../services/graphileWorker';
import { getDelta, tweetExists } from '../../utils';

const log = logger(import.meta, undefined, config.TWITTER.LOG_LEVEL);

async function updateQuestInstance(
  quest: QuestInstance,
  {
    name,
    description,
    community_id,
    image_url,
    start_date,
    end_date,
    max_xp_to_end,
  }: z.infer<(typeof schemas.UpdateQuest)['input']>,
  transaction?: Transaction,
) {
  const delta = getDelta(quest, {
    name,
    description,
    community_id,
    image_url,
    start_date,
    end_date,
    max_xp_to_end,
  });
  delta.community_id =
    !!community_id || community_id === null ? community_id : quest.community_id;

  if (Object.keys(delta).length) {
    await models.Quest.update(delta, {
      where: { id: quest.id! },
      transaction,
    });
  }
}

async function updateChannelQuest(
  quest: QuestInstance,
  actionMetas: z.infer<typeof schemas.ActionMetaInput>[] | undefined,
  payload: z.infer<(typeof schemas.UpdateQuest)['input']>,
) {
  if (quest.quest_type !== 'channel') return;

  // DELETION
  if (!actionMetas) {
    await models.sequelize.transaction(async (transaction) => {
      await updateQuestInstance(quest, payload, transaction);
      const existingMeta = await models.QuestActionMeta.findOne({
        where: {
          quest_id: quest.id!,
        },
        transaction,
      });
      if (quest.scheduled_job_id && existingMeta) {
        await removeJob({
          jobId: quest.scheduled_job_id,
          transaction,
        });
      }
      await existingMeta?.destroy({ transaction });
    });
    return;
  }

  if (actionMetas.length > 1)
    throw new InvalidInput(
      'Cannot have more than one action per channel quest',
    );
  const actionMeta = actionMetas[0];

  if (
    !['TweetEngagement', 'XpChainEventCreated'].includes(actionMeta.event_name)
  ) {
    throw new InvalidInput(
      `Invalid action "${actionMeta.event_name}" for channel quest`,
    );
  }

  // UPDATE OR CREATE
  if (actionMeta.event_name === 'TweetEngagement') {
    if (!actionMeta.content_id)
      throw new InvalidInput('TweetEngagement action must have a Tweet url');
    const [, ...rest] = actionMeta.content_id.split(':'); // this has been validated by the schema
    const tweetUrl = rest.join(':');
    const tweetId = tweetUrl.split('/').at(-1)!;
    mustExist(`Tweet with url "${tweetUrl}"`, await tweetExists(tweetId));
    mustExist(`Tweet engagement caps`, actionMeta.tweet_engagement_caps);

    await models.sequelize.transaction(async (transaction) => {
      await updateQuestInstance(quest, payload, transaction);

      const existingActionMeta = await models.QuestActionMeta.findOne({
        where: {
          quest_id: quest.id!,
        },
        transaction,
      });
      if (existingActionMeta) {
        await models.QuestTweets.destroy({
          where: {
            quest_action_meta_id: existingActionMeta.id!,
          },
          transaction,
        });
        await existingActionMeta.destroy({ transaction });
        if (quest.scheduled_job_id) {
          await removeJob({
            jobId: quest.scheduled_job_id,
            transaction,
          });
        }
      }
      const duplicateCheck = await models.QuestTweets.findOne({
        where: {
          tweet_id: tweetId,
        },
      });
      if (duplicateCheck) {
        throw new InvalidState('This Tweet URL is already part of a quest');
      }
      const actionMetaInstance = await models.QuestActionMeta.create(
        {
          ...actionMeta,
          quest_id: quest.id!,
        },
        { transaction },
      );
      await models.QuestTweets.create(
        {
          tweet_id: tweetId,
          tweet_url: tweetUrl,
          quest_action_meta_id: actionMetaInstance.id!,
          like_cap: actionMeta.tweet_engagement_caps!.likes,
          retweet_cap: actionMeta.tweet_engagement_caps!.retweets,
          replies_cap: actionMeta.tweet_engagement_caps!.replies,
        },
        { transaction },
      );
      log.trace(`Created quest tweet ${tweetId} for quest ${quest.id}`);
      const job = await scheduleTask(
        GraphileTaskNames.AwardTwitterEngagementXp,
        {
          quest_id: quest.id!,
          quest_ended: true,
        },
        {
          runAt: quest.end_date,
          transaction,
        },
      );
      log.trace(`Scheduled job ${job.id} for quest ${quest.id}`);
      quest.scheduled_job_id = job.id;
      await quest.save({ transaction });
    });
  } else if (actionMeta.event_name === 'XpChainEventCreated') {
    const chainEvent = actionMeta.chain_event;
    if (!chainEvent) throw new InvalidInput('Missing chain event source data');
    await models.sequelize.transaction(async (transaction) => {
      await updateQuestInstance(quest, payload, transaction);

      const existingActionMeta = await models.QuestActionMeta.findOne({
        where: {
          quest_id: quest.id!,
        },
        transaction,
      });
      if (existingActionMeta) {
        await models.ChainEventXpSource.destroy({
          where: {
            quest_action_meta_id: existingActionMeta.id!,
          },
          transaction,
        });
        await existingActionMeta.destroy({ transaction });
      }

      const chainNode = await models.ChainNode.scope('withPrivateData').findOne(
        {
          where: {
            eth_chain_id: chainEvent.eth_chain_id,
          },
          transaction,
        },
      );
      mustExist(`Chain node`, chainNode);

      const verificationRes = await verifyEventSource({
        rpc: chainNode.private_url!,
        contractAddress: chainEvent.contract_address,
        readableEventSignature: chainEvent.event_signature,
        txHash: chainEvent.tx_hash,
      });

      if (!verificationRes.valid) {
        throw new InvalidInput(verificationRes.reason);
      }

      const actionMetaInstance = await models.QuestActionMeta.create(
        {
          ...actionMeta,
          quest_id: quest.id!,
        },
        { transaction },
      );
      await models.ChainEventXpSource.create(
        {
          chain_node_id: chainNode.id!,
          contract_address: chainEvent.contract_address,
          event_signature: toEventHash(chainEvent.event_signature),
          transaction_hash: chainEvent.tx_hash,
          readable_signature: chainEvent.event_signature,
          quest_action_meta_id: actionMetaInstance.id!,
          active: true,
        },
        { transaction },
      );
      log.trace(`Created chain event xp source for quest ${quest.id}`);
    });
  }
}

async function updateCommonQuest(
  quest: QuestInstance,
  payload: z.infer<(typeof schemas.UpdateQuest)['input']>,
) {
  const { quest_id, community_id, action_metas } = payload;
  const c_id = community_id || quest.community_id;
  const actions = await Promise.all(
    action_metas?.map(async (action_meta) => {
      if (action_meta.content_id) {
        // make sure content_id exists
        const [content_type, content_id] = action_meta.content_id.split(':'); // this has been validated by the schema
        if (content_type === 'chain') {
          const chain = await models.ChainNode.findOne({
            where: { id: +content_id },
          });
          mustExist(`Chain node with id "${content_id}"`, chain);
        } else if (content_type === 'topic') {
          const topic = await models.Topic.findOne({
            where: c_id
              ? { id: +content_id, community_id: c_id }
              : { id: +content_id },
          });
          mustExist(`Topic with id "${content_id}"`, topic);
        } else if (content_type === 'thread') {
          const thread = await models.Thread.findOne({
            where: c_id
              ? { id: +content_id, community_id: c_id }
              : { id: +content_id },
          });
          mustExist(`Thread with id "${content_id}"`, thread);
        } else if (content_type === 'comment') {
          const comment = await models.Comment.findOne({
            where: { id: +content_id },
            include: c_id
              ? [
                  {
                    model: models.Thread,
                    attributes: ['community_id'],
                    required: true,
                    where: { community_id: c_id },
                  },
                ]
              : [],
          });
          mustExist(`Comment with id "${content_id}"`, comment);
        } else if (content_type === 'group') {
          const group = await models.Group.findOne({
            where: c_id
              ? { id: +content_id, community_id: c_id }
              : { id: +content_id },
          });
          mustExist(`Group with id "${content_id}"`, group);
        } else if (content_type === 'goal') {
          if (!c_id)
            throw new InvalidInput(
              'Community id is required when setting goals',
            );
          const goal = await models.CommunityGoalMeta.findOne({
            where: { id: +content_id },
          });
          mustExist(`Community goal with id "${content_id}"`, goal);
        }
        return { action_meta, content_type, content_id: +content_id };
      }
      return { action_meta };
    }) || [],
  );

  await models.sequelize.transaction(async (transaction) => {
    if (actions.length) {
      // clean existing action_metas
      await models.QuestActionMeta.destroy({
        where: { quest_id },
        transaction,
      });
      // create new action_metas
      await models.QuestActionMeta.bulkCreate(
        actions.map(({ action_meta, content_type, content_id }) => ({
          ...action_meta,
          quest_id,
          community_goal_meta_id: content_type === 'goal' ? content_id : null,
        })),
      );
      // set community goal reached entries
      await models.CommunityGoalReached.bulkCreate(
        actions
          .filter((a) => a.content_type === 'goal')
          .map(({ content_id }) => ({
            community_goal_meta_id: content_id!,
            community_id: c_id!,
          })),
      );
    }
    await updateQuestInstance(quest, payload, transaction);
  });
}

export function UpdateQuest(): Command<typeof schemas.UpdateQuest> {
  return {
    ...schemas.UpdateQuest,
    auth: [isSuperAdmin],
    secure: true,
    body: async ({ payload }) => {
      const {
        quest_id,
        name,
        community_id,
        start_date,
        end_date,
        action_metas,
      } = payload;

      const quest = await models.Quest.scope('withPrivateData').findOne({
        where: { id: quest_id },
      });
      mustExist(`Quest with id "${quest_id}`, quest);

      if (name) {
        const existingName = await models.Quest.findOne({
          where: { community_id: community_id ?? null, name },
          attributes: ['id'],
        });
        mustNotExist(
          `Quest named "${name}" in community "${community_id}"`,
          existingName,
        );
      }

      mustNotBeStarted(start_date ?? quest.start_date);
      mustBeValidDateRange(
        start_date ?? quest.start_date,
        end_date ?? quest.end_date,
      );

      if (quest.quest_type === 'channel') {
        await updateChannelQuest(quest, action_metas, payload);
      } else {
        await updateCommonQuest(quest, payload);
      }

      const updated = await models.Quest.findOne({
        where: { id: quest_id },
        include: { model: models.QuestActionMeta, as: 'action_metas' },
      });
      return updated!.toJSON();
    },
  };
}
