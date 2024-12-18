import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { sanitizeDeletedComment } from '../utils/sanitizeDeletedComment';

export function ViewComments(): Query<typeof schemas.ViewComments> {
  return {
    ...schemas.ViewComments,
    auth: [],
    body: async ({ payload }) => {
      const comments = await models.Comment.findAll({
        include: [
          {
            model: models.Address,
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
          {
            model: models.Thread,
            attributes: ['id'],
            required: true,
            where: { id: payload.thread_id },
          },
          {
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
          },
          {
            model: models.CommentVersionHistory,
          },
        ],
        order: [['created_at', 'DESC']],
        paranoid: false,
      });

      return comments.map((c) => {
        const data = c.toJSON();
        return {
          ...sanitizeDeletedComment(data),
          last_edited: data.updated_at?.toISOString(),
          community_id: data.Thread!.community_id!,
          Address: {
            ...data.Address!,
            User: data.Address!.User!,
          },
          Thread: data.Thread!,
        };
      });
    },
  };
}
