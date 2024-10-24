import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { removeUndefined, sanitizeDeletedComment } from '../utils/index';
import { formatSequelizePagination } from '../utils/paginationUtils';

export function GetComments(): Query<typeof schemas.GetComments> {
  return {
    ...schemas.GetComments,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { thread_id, comment_id, include_user, include_reactions } =
        payload;

      const includeArray = [];
      if (include_user) {
        includeArray.push({
          model: models.Address,
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
              attributes: ['address', 'last_active'],
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

      const { count, rows: comments } = await models.Comment.findAndCountAll({
        where: removeUndefined({ thread_id, id: comment_id }),
        include: includeArray,
        ...formatSequelizePagination(payload),
        paranoid: false,
      });

      const sanitizedComments = comments.map((c) => {
        const data = c.toJSON();
        return {
          ...sanitizeDeletedComment(data),
          last_edited: data.updated_at,
        };
      });

      return schemas.buildPaginatedResponse(sanitizedComments, count, payload);
    },
  };
}
