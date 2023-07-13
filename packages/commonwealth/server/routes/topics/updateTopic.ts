import {
  TypedRequest,
  TypedRequestBody,
  TypedResponse,
  success,
} from '../../types';
import { AppError } from '../../../../common-common/src/errors';
import type { DB } from '../../models';
import { findAllRoles } from '../../util/roles';
import Sequelize from 'sequelize';
const Op = Sequelize.Op;

const Errors = {
  MissingTopic: 'Invalid topic ID',
  Failed: 'Unable to save',
  NotAdmin: 'Not an admin',
};

type UpdateTopicReq = {
  topic_id: string;
  channel_id: string;
  chain_id: string;
};
type UpdateThreadResponse = {};

const updateTopic = async (
  models: DB,
  req: TypedRequestBody<UpdateTopicReq>,
  res: TypedResponse<UpdateThreadResponse>
) => {
  const { topic_id, channel_id, chain_id } = req.body;

  const isAdmin = await findAllRoles(models, {}, chain_id, ['admin']);

  if (!isAdmin || !isAdmin.length) throw new AppError(Errors.NotAdmin);

  const topic = await models.Topic.findOne({
    where: {
      id: topic_id,
    },
  });

  if (!topic) throw new AppError(Errors.MissingTopic);

  // Find previous topic associated with channel
  const topicWithChannel = await models.Topic.findOne({
    where: {
      channel_id,
    },
  });

  if (topicWithChannel && topicWithChannel.id !== topic.id) {
    // Previous threads on topic from discord bot
    const threadsOnTopicFromDiscordBot = await models.Thread.findAll({
      where: {
        topic_id: topicWithChannel.id,
        // discord meta is not null
        discord_meta: {
          [Op.ne]: null,
        },
      },
    });

    // batch update threads to have new topic id
    await models.Thread.update(
      {
        topic_id: topic.id,
      },
      {
        where: {
          id: threadsOnTopicFromDiscordBot.map((thread) => thread.id),
        },
      }
    );

    // Remove channel_id from old topic
    topicWithChannel.channel_id = null;
    await topicWithChannel.save();
  }

  try {
    topic.channel_id = channel_id;
    await topic.save();
  } catch (e) {
    console.log(e);
    throw new AppError(Errors.Failed);
  }

  return success(res, {});
};

export default updateTopic;
