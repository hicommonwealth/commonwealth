import { Op } from 'sequelize';
import { ServerThreadsController } from '../server_threads_controller';
import getThreadsWithCommentCount from '../../util/getThreadCommentsCount';
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

  threads = await getThreadsWithCommentCount({
    threads: threads.map((th) => th.toJSON()),
    models: this.models,
  });

  return threads;
}
