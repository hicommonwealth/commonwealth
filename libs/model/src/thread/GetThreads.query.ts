import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Comment } from '@hicommonwealth/schemas';
import { FindAndCountOptions } from 'sequelize';
import { models } from '../database';
import { ThreadAttributes } from '../models';
import { removeUndefined } from '../utils';
import { formatSequelizePagination } from '../utils/paginationUtils';

export function GetThreads(): Query<typeof schemas.GetThreads> {
  return {
    input: schemas.GetThreads.input,
    output: schemas.GetThreads.output.extend({ Comment: Comment.nullish() }),
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const {
        community_id,
        topic_id,
        thread_id,
        include_comments,
        include_user,
        include_reactions,
      } = payload;

      const includeArray = [];
      if (include_comments) {
        includeArray.push({
          model: models.Comment,
          as: 'Comments',
          include: [
            {
              model: models.Address,
              as: 'Address',
              attributes: ['id', 'address', 'last_active'],
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
        });
      }
      if (include_user) {
        includeArray.push({
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
        });
      }

      if (include_reactions) {
        includeArray.push({
          model: models.Reaction,
          as: 'reactions',
          include: [
            {
              model: models.Address,
              as: 'Address',
              required: true,
              attributes: ['id', 'address', 'last_active'],
              include: [
                {
                  model: models.User,
                  attributes: ['id', 'profile'],
                },
              ],
            },
          ],
        });
      }

      const { count, rows: threads } = await models.Thread.findAndCountAll({
        where: removeUndefined({ community_id, topic_id, id: thread_id }),
        include: includeArray,
        ...formatSequelizePagination(payload),
        paranoid: false,
      } as unknown as FindAndCountOptions<ThreadAttributes>);

      return schemas.buildPaginatedResponse(threads, count as number, payload);
    },
  };
}
