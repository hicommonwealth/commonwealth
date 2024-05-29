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
        include: [
          {
            model: this.models.User,
            as: 'User',
            required: true,
            attributes: ['id'],
            include: [
              {
                model: this.models.Profile,
                as: 'Profiles',
                required: true,
                attributes: ['id', 'avatar_url', 'profile_name'],
              },
            ],
          },
        ],
      },
      {
        model: this.models.Address,
        as: 'collaborators',
        include: [
          {
            model: this.models.User,
            as: 'User',
            required: true,
            attributes: ['id'],
            include: [
              {
                model: this.models.Profile,
                as: 'Profiles',
                required: true,
                attributes: [
                  'id',
                  ['avatar_url', 'avatarUrl'],
                  ['profile_name', 'name'],
                ],
              },
            ],
          },
        ],
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
            include: [
              {
                model: this.models.User,
                as: 'User',
                required: true,
                attributes: ['id'],
                include: [
                  {
                    model: this.models.Profile,
                    as: 'Profiles',
                    required: true,
                    attributes: ['id', 'avatar_url', 'profile_name'],
                  },
                ],
              },
            ],
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
