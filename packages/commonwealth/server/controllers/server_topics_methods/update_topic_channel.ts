import { AppError } from '@hicommonwealth/adapters';
import { Op } from 'sequelize';
import { CommunityInstance } from '../../models/community';
import { UserInstance } from '../../models/user';
import { validateOwner } from '../../util/validateOwner';
import { ServerTopicsController } from '../server_topics_controller';

const Errors = {
  MissingTopic: 'Invalid topic ID',
  Failed: 'Unable to save',
  NotAdmin: 'Not an admin',
};

export type UpdateTopicChannelOptions = {
  user: UserInstance;
  community: CommunityInstance;
  topicId: number;
  channelId: string;
};

export type UpdateTopicChannelResult = void;

export async function __updateTopicChannel(
  this: ServerTopicsController,
  { user, community, topicId, channelId }: UpdateTopicChannelOptions,
): Promise<UpdateTopicChannelResult> {
  const isAdmin = await validateOwner({
    models: this.models,
    user: user,
    communityId: community.id,
    allowMod: true,
    allowAdmin: true,
    allowGodMode: true,
  });

  if (!isAdmin) {
    throw new AppError(Errors.NotAdmin);
  }

  const topic = await this.models.Topic.findOne({
    where: {
      id: topicId,
    },
  });

  if (!topic) {
    throw new AppError(Errors.MissingTopic);
  }

  // Find previous topic associated with channel
  const topicWithChannel = await this.models.Topic.findOne({
    where: {
      channel_id: channelId ? channelId : topic.channel_id,
    },
  });

  // Either we are removing a connect (channel_id is null) or we are connecting to a new channel
  if (topicWithChannel && (topicWithChannel.id !== topic.id || !channelId)) {
    // Previous threads on topic from discord bot
    const threadsOnTopicFromDiscordBot = await this.models.Thread.findAll({
      where: {
        topic_id: topicWithChannel.id,
        // discord meta is not null
        discord_meta: {
          [Op.ne]: null,
        },
      },
    });

    // batch update threads to have new topic id
    await this.models.Thread.update(
      {
        topic_id: channelId ? topic.id : null,
      },
      {
        where: {
          id: {
            [Op.in]: threadsOnTopicFromDiscordBot.map((thread) => thread.id),
          },
        },
      },
    );

    // Remove channel_id from old topic
    topicWithChannel.channel_id = null;
    await topicWithChannel.save();
  } else {
    // No previous topic associated with channel. Set all threads with channel id to new topic
    const threadsOnTopicFromDiscordBot = await this.models.Thread.findAll({
      where: {
        community_id: community.id,
        // discord meta is not null
        discord_meta: {
          channel_id: channelId,
        },
      },
    });

    // batch update threads to have new topic id
    await this.models.Thread.update(
      {
        topic_id: topic.id,
      },
      {
        where: {
          id: {
            [Op.in]: threadsOnTopicFromDiscordBot.map((thread) => thread.id),
          },
        },
      },
    );
  }

  try {
    topic.channel_id = channelId;
    await topic.save();
  } catch (e) {
    console.log(e);
    throw new AppError(Errors.Failed);
  }
}
