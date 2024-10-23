import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models, sequelize } from '../database';

export function GetThreadsByIds(): Query<typeof schemas.GetThreadsByIds> {
  return {
    ...schemas.GetThreadsByIds,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { community_id, thread_ids } = payload;
      const threads = await models.Thread.findAll({
        where: {
          community_id,
          id: { [Op.in]: thread_ids.split(',') },
        },

        include: [
          {
            model: models.Address,
            as: 'Address',
            include: [
              {
                model: models.User,
                as: 'User',
                required: true,
                attributes: ['id', 'profile'],
              },
            ],
          },
          {
            model: models.Address,
            as: 'collaborators',
            include: [
              {
                model: models.User,
                as: 'User',
                required: true,
                attributes: ['id', 'profile'],
              },
            ],
          },
          {
            model: models.Topic,
            as: 'topic',
          },
          {
            model: models.Reaction,
            as: 'reactions',
            include: [
              {
                model: models.Address,
                as: 'Address',
                required: true,
                include: [
                  {
                    model: models.User,
                    as: 'User',
                    required: true,
                    attributes: ['id', 'profile'],
                  },
                ],
              },
            ],
          },
          {
            model: models.ContestAction,
            where: {
              action: 'upvoted',
            },
            required: false,
            attributes: ['content_id', 'thread_id'],
            include: [
              {
                model: models.Contest,
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
                    model: models.ContestManager,
                    attributes: ['name', 'cancelled', 'interval'],
                  },
                ],
              },
            ],
          },
          {
            model: models.ThreadVersionHistory,
          },
        ],
      });

      return threads.map((t) => t.toJSON());
    },
  };
}
