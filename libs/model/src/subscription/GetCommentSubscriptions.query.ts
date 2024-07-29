import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

const associationParams = [
  {
    model: models.Comment,
    as: 'Comment',
    include: [
      {
        model: models.Thread,
        as: 'Thread',
        include: [
          {
            model: models.Address,
            as: 'Address',
          },
          {
            model: models.Community,
            as: 'Community',
            required: true,
            where: { active: true },
          },
        ],
      },
    ],
  },
];

export function GetCommentSubscriptions(): Query<
  typeof schemas.GetCommentSubscriptions
> {
  return {
    ...schemas.GetCommentSubscriptions,
    auth: [],
    secure: true,
    body: async ({ actor }) => {
      return (
        await models.CommentSubscription.findAll({
          where: {
            user_id: actor.user.id,
          },
          include: [...associationParams],
        })
      ).map((subscription) => subscription.get({ plain: true }));
    },
  };
}
