import { Op } from 'sequelize';
import { ServerThreadsController } from '../server_threads_controller';
import { ThreadAttributes } from '../../models/thread';

export type GetThreadsByIdOptions = {
  threadIds: number[];
};

export type GetThreadsByIdResult = ThreadAttributes[];

export async function __getThreadsById(
  this: ServerThreadsController,
  { threadIds }: GetThreadsByIdOptions
): Promise<GetThreadsByIdResult> {
  let threads;
  threads = await this.models.Thread.findAll({
    where: {
      id: { [Op.in]: threadIds },
      // chain: req.chain ? req.chain.id : undefined,
    },
    include: [
      {
        model: this.models.Address,
        as: 'Address',
      },
      {
        model: this.models.Address,
        // through: models.Collaboration,
        as: 'collaborators',
      },
      {
        model: this.models.Topic,
        as: 'topic',
      },
      {
        model: this.models.Reaction,
        as: 'reactions',
        include: [
          {
            model: this.models.Address,
            as: 'Address',
            required: true,
          },
        ],
      },
    ],
  });

  threads = threads.map((thread) => {
    const t = thread.toJSON();
    t.numberOfComments = t.comment_count || 0;
    return t;
  });

  return threads;
}
