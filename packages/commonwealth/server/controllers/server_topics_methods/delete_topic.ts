import { AppError } from '@hicommonwealth/adapters';
import { CommunityInstance } from '../../models/community';
import { UserInstance } from '../../models/user';
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
  community: CommunityInstance;
  topicId: number;
};

export type DeleteTopicResult = void;

export async function __deleteTopic(
  this: ServerTopicsController,
  { user, community, topicId }: DeleteTopicOptions,
): Promise<DeleteTopicResult> {
  const isAdmin = validateOwner({
    models: this.models,
    user,
    communityId: community.id,
    allowMod: true,
    allowAdmin: true,
    allowGodMode: true,
  });
  if (!isAdmin) {
    throw new AppError(Errors.NotAdmin);
  }

  const topic = await this.models.Topic.findOne({ where: { id: topicId } });
  if (!topic) {
    throw new AppError(Errors.TopicNotFound);
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
          community_id: community.id,
        },
        transaction,
      },
    );
    await topic.destroy({ transaction });
  });
}
