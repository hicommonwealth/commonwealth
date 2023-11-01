import { QueryTypes } from 'sequelize';
import { AppError } from '../../../../common-common/src/errors';
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
  chain: CommunityInstance;
  topicId: number;
};

export type DeleteTopicResult = void;

export async function __deleteTopic(
  this: ServerTopicsController,
  { user, chain, topicId }: DeleteTopicOptions,
): Promise<DeleteTopicResult> {
  const isAdmin = validateOwner({
    models: this.models,
    user,
    chainId: chain.id,
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
    await this.models.sequelize.query(
      `UPDATE "Threads" SET topic_id=null WHERE topic_id = $id AND chain = $chain;`,
      {
        bind: {
          id: topicId,
          chain: chain.id,
        },
        type: QueryTypes.UPDATE,
        transaction,
      },
    );
    await topic.destroy({ transaction });
  });
}
