import { InvalidInput, Query } from '@hicommonwealth/core';
import { ThreadInstance } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { z } from 'zod';
import { models, sequelize } from '../../database';

export function GetThreadsByIds(): Query<typeof schemas.GetThreadsByIds> {
  return {
    ...schemas.GetThreadsByIds,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { community_id, thread_ids } = payload;
      if (thread_ids === '') return [];

      let parsedThreadIds: number[];

      try {
        parsedThreadIds = z
          .string()
          .transform((ids) =>
            ids.split(',').map((id) => parseInt(id.trim(), 10)),
          )
          .parse(thread_ids);
      } catch (e) {
        throw new InvalidInput('Invalid thread_ids format');
      }

      let threads: ThreadInstance[];
      await models.sequelize.transaction(async (transaction) => {
        threads = await models.Thread.findAll({
          where: {
            ...(community_id && { community_id }),
            id: { [Op.in]: parsedThreadIds },
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
              required: true,
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
                      sequelize.col(
                        '"ContestActions->Contest".contest_address',
                      ),
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
          transaction,
        });
      });

      return threads!.map(
        (t) => t.toJSON() as z.infer<typeof schemas.ThreadView>,
      );
    },
  };
}
