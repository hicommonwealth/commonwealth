import { ThreadAttributes } from '@hicommonwealth/model';
import { Op } from 'sequelize';
import { ServerThreadsController } from '../server_threads_controller';

export type GetThreadsByIdOptions = {
  threadIds: number[];
};

export type GetThreadsByIdResult = ThreadAttributes[];

export async function __getThreadsById(
  this: ServerThreadsController,
  { threadIds }: GetThreadsByIdOptions,
): Promise<GetThreadsByIdResult> {
  const threads = await this.models.Thread.findAll({
    where: {
      id: { [Op.in]: threadIds },
    },
    include: [
      {
        model: this.models.Address,
        as: 'Address',
      },
      {
        model: this.models.Address,
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

  const result = threads.map((thread) => {
    const t = thread.toJSON();
    (t as any).numberOfComments = t.comment_count || 0;
    return t;
  });

  return result;
}
