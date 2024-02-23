import { AppError } from '@hicommonwealth/core';
import { UserInstance } from '@hicommonwealth/model';
import { validateOwner } from '../../util/validateOwner';
import { ServerTopicsController } from '../server_topics_controller';

export const Errors = {
  NotLoggedIn: 'Not signed in',
  NoTopicId: 'Must provide topic ID',
  NotAdmin: 'Only admins can delete topics',
  TopicNotFound: 'Topic not found',
  DeleteFail: 'Could not delete topic',
};

export type DeleteTopicOptions = {
  user: UserInstance;
  topicId: number;
};

export type DeleteTopicResult = void;

export async function __deleteTopic(
  this: ServerTopicsController,
  { user, topicId }: DeleteTopicOptions,
): Promise<DeleteTopicResult> {
  const topic = await this.models.Topic.findByPk(topicId);
  if (!topic) {
    throw new AppError(Errors.TopicNotFound);
  }

  const isAdmin = validateOwner({
    models: this.models,
    user,
    communityId: topic.community_id,
    allowMod: true,
    allowAdmin: true,
    allowSuperAdmin: true,
  });
  if (!isAdmin) {
    throw new AppError(Errors.NotAdmin);
  }

  // remove topic from threads, then delete topic
  await this.models.sequelize.transaction(async (transaction) => {
    await this.models.Thread.update(
      {
        topic_id: null,
      },
      {
        where: {
          topic_id: topicId,
          community_id: topic.community_id,
        },
        transaction,
      },
    );
    await topic.destroy({ transaction });
  });
}
