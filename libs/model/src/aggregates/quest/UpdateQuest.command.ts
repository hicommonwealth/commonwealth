import { Command, InvalidInput, logger } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Transaction } from 'sequelize';
import z from 'zod';
import { config } from '../../config';
import { models } from '../../database';
import { isSuperAdmin } from '../../middleware';
import {
  mustBeValidDateRange,
  mustExist,
  mustNotBeStarted,
  mustNotExist,
} from '../../middleware/guards';
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
  eventName: 'TweetEngagement',
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
          event_name: eventName,
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
  if (actionMeta.event_name !== eventName)
    throw new InvalidInput(
      `Invalid action "${actionMeta.event_name}" for channel quest`,
    );

  // UPDATE OR CREATE
  if (eventName === 'TweetEngagement') {
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
        GraphileTaskNames.AwardTwitterQuestXp,
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
  }
}

async function updateCommonQuest(
  quest: QuestInstance,
  payload: z.infer<(typeof schemas.UpdateQuest)['input']>,
) {
  const { quest_id, community_id, action_metas } = payload;
  if (action_metas) {
    const c_id = community_id || quest.community_id;
    await Promise.all(
      action_metas.map(async (action_meta) => {
        // enforce comment upvoted action is scoped to a thread
        if (
          action_meta.event_name === 'CommentUpvoted' &&
          !action_meta.content_id?.startsWith('thread:')
        ) {
          throw new InvalidInput(
            'CommentUpvoted action must be scoped to a thread',
          );
        }
        if (action_meta.content_id) {
          // make sure content_id exists
          const [content, id] = action_meta.content_id.split(':'); // this has been validated by the schema
          if (content === 'chain') {
            const chain = await models.ChainNode.findOne({
              where: { id: +id },
            });
            mustExist(`Chain node with id "${id}"`, chain);
          } else if (content === 'topic') {
            const topic = await models.Topic.findOne({
              where: c_id ? { id: +id, community_id: c_id } : { id: +id },
            });
            mustExist(`Topic with id "${id}"`, topic);
          } else if (content === 'thread') {
            const thread = await models.Thread.findOne({
              where: c_id ? { id: +id, community_id: c_id } : { id: +id },
            });
            mustExist(`Thread with id "${id}"`, thread);
          } else if (content === 'comment') {
            const comment = await models.Comment.findOne({
              where: { id: +id },
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
            mustExist(`Comment with id "${id}"`, comment);
          } else if (content === 'goal') {
            if (!c_id)
              throw new InvalidInput(
                'Community id is required when setting goals',
              );
            const goal = await models.CommunityGoalMeta.findOne({
              where: { id: +id },
            });
            mustExist(`Community goal with id "${id}"`, goal);
          }
        }
      }),
    );
  }

  await models.sequelize.transaction(async (transaction) => {
    if (action_metas?.length) {
      // clean existing action_metas
      await models.QuestActionMeta.destroy({
        where: { quest_id },
        transaction,
      });
      // create new action_metas
      await models.QuestActionMeta.bulkCreate(
        action_metas.map((action_meta) => ({
          ...action_meta,
          quest_id,
        })),
      );
      // set community goal reached entries
      await models.CommunityGoalReached.bulkCreate(
        action_metas
          .filter(
            (m) =>
              m.event_name === 'CommunityGoalReached' &&
              m.content_id?.startsWith('goal:'),
          )
          .map((m) => ({
            community_goal_meta_id: +m.content_id!.split(':')[1]!,
            community_id: community_id || quest.community_id!,
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
        await updateChannelQuest(
          'TweetEngagement',
          quest,
          action_metas,
          payload,
        );
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
