import { ThreadAttributes, UserAttributes } from '@hicommonwealth/model';
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
  const sequelize = this.models.Sequelize;
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
            attributes: ['id', 'profile'],
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
            attributes: ['id', 'profile'],
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
                attributes: ['id', 'profile'],
              },
            ],
          },
        ],
      },
      {
        model: this.models.ContestAction,
        where: {
          action: 'upvoted',
        },
        required: false,
        attributes: ['content_id', 'thread_id'],
        include: [
          {
            model: this.models.Contest,
            on: {
              contest_id: sequelize.where(
                sequelize.col('"ContestActions".contest_id'),
                '=',
                sequelize.col('"ContestActions->Contest".contest_id'),
              ),
              contest_address: sequelize.where(
                sequelize.col('"ContestActions".contest_address'),
                '=',
                sequelize.col('"ContestActions->Contest".contest_address'),
              ),
            },
            attributes: [
              'contest_id',
              'contest_address',
              'score',
              'start_time',
              'end_time',
            ],
            include: [
              {
                model: this.models.ContestManager,
                attributes: ['name', 'cancelled', 'interval'],
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

    // TO BE REMOVED - mappings to Profiles[] as expected UI response
    // @ts-expect-error StrictNullChecks
    const u: UserAttributes = t.Address.User;
    if (u) {
      u.Profiles = [
        {
          user_id: u.id!,
          id: t.Address?.profile_id ?? undefined,
          profile_name: u.profile.name ?? undefined,
          avatar_url: u.profile.avatar_url ?? undefined,
        },
      ];
    }
    t.collaborators?.forEach((c) => {
      if (c.User)
        c.User.Profiles = [
          {
            user_id: c.User.id!,
            id: c.profile_id,
            profile_name: c.User.profile.name ?? undefined,
            avatar_url: c.User.profile.avatar_url ?? undefined,
          },
        ];
    });
    t.reactions?.forEach((r) => {
      if (r.Address?.User)
        r.Address.User.Profiles = [
          {
            user_id: r.Address.User.id!,
            id: r.Address?.profile_id,
            profile_name: r.Address?.User.profile.name ?? undefined,
            avatar_url: r.Address?.User.profile.avatar_url ?? undefined,
          },
        ];
    });
    return t;
  });
  return result;
}
