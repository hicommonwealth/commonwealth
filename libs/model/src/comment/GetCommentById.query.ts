import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

export function GetCommentById(): Query<typeof schemas.GetCommentById> {
  return {
    ...schemas.GetCommentById,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { comment_id } = payload;

      const comment = await models.Comment.findOne({
        where: {
          id: comment_id,
        },
      });

      return comment as any;
    },
  };
}
