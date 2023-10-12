import { Op } from 'sequelize';
import { TopicAttributes, TopicInstance } from '../../models/topic';
import { ChainInstance } from '../../models/chain';
import { ServerTopicsController } from '../server_topics_controller';
import { UserInstance } from '../../models/user';
import { AppError } from '../../../../common-common/src/errors';
import { validateOwner } from 'server/util/validateOwner';

const Errors = {
  NoUser: 'Not signed in',
  NoIds: 'Must supply ordered array of topic IDs',
  NoChain: 'Must supply a chain ID',
  NoPermission: `You do not have permission to order topics`,
  InvalidTopic:
    'Passed topics may not all be featured, or may include an invalid ID',
};

export type UpdateTopicsOrderOptions = {
  user: UserInstance;
  chain: ChainInstance;
  body: {
    orderIds: string[];
  };
};

export type UpdateTopicsOrderResult = TopicAttributes[];

export async function __updateTopicsOrder(
  this: ServerTopicsController,
  { user, chain, body: { orderIds: newTopicOrder } }: UpdateTopicsOrderOptions
): Promise<UpdateTopicsOrderResult> {
  if (!user) {
    throw new AppError(Errors.NoUser);
  }

  const isAdminOrMod = await validateOwner({
    models: this.models,
    user: user,
    chainId: chain.id,
    allowMod: true,
    allowAdmin: true,
    allowGodMode: true,
  });
  if (!isAdminOrMod) {
    throw new AppError(Errors.NoPermission);
  }

  if (!newTopicOrder?.length) {
    return;
  }

  const topics: TopicInstance[] = await Promise.all(
    newTopicOrder.map((id: string, idx: number) => {
      return (async () => {
        const topic = await this.models.Topic.findOne({
          where: { id, featured_in_sidebar: true },
        });
        if (!topic) {
          throw new AppError(Errors.InvalidTopic);
        }
        topic.order = idx + 1;
        await topic.save();
        return topic;
      })();
    })
  );

  return topics.map((t) => t.toJSON());
}
