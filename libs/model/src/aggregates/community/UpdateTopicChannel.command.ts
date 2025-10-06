import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models } from '../../database';
import { authTopic, mustExist } from '../../middleware';

export function UpdateTopicChannel(): Command<
  typeof schemas.UpdateTopicChannel
> {
  return {
    ...schemas.UpdateTopicChannel,
    auth: [authTopic({ roles: ['admin', 'moderator'] })],
    body: async ({ payload }) => {
      const { topic_id, channel_id } = payload;

      const topic = await models.Topic.findByPk(topic_id!);
      mustExist('Topic', topic);

      await models.sequelize.transaction(async (transaction) => {
        // find previous topic associated with channel
        const old_topic = await models.Topic.findOne({
          where: { channel_id: channel_id || topic.channel_id },
          transaction,
        });

        // either we are removing a connect (channel_id is null) or we are connecting to a new channel
        if (old_topic && (old_topic.id !== topic.id || !channel_id)) {
          // previous threads on topic from discord bot
          const thread_ids = await models.Thread.findAll({
            where: {
              topic_id: old_topic.id,
              discord_meta: { [Op.ne]: null },
            },
            attributes: ['id'],
            transaction,
          });
          await models.Thread.update(
            { topic_id: topic.id },
            {
              where: { id: { [Op.in]: thread_ids.map((t) => t.id!) } },
              transaction,
            },
          );
          // remove channel_id from old topic
          old_topic.channel_id = null;
          await old_topic.save({ transaction });
        } else {
          // no previous topic associated with channel... set all threads with channel id to new topic
          const thread_ids = await models.Thread.findAll({
            where: {
              community_id: topic.community_id,
              discord_meta: { channel_id },
            },
            attributes: ['id'],
            transaction,
          });
          await models.Thread.update(
            { topic_id: topic.id },
            {
              where: { id: { [Op.in]: thread_ids.map((t) => t.id!) } },
              transaction,
            },
          );
        }

        topic.channel_id = channel_id;
        await topic.save({ transaction });
      });

      return topic.toJSON();
    },
  };
}
