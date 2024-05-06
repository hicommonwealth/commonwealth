import { EventHandler } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { Op } from 'sequelize';
import { ZodUndefined } from 'zod';

export const processCommentCreated: EventHandler<
  'CommentCreated',
  ZodUndefined
> = async ({ payload }) => {
  const authorAddress = await models.Address.findOne({
    where: {
      id: payload.address_id,
    },
  });

  const commentSubs = (
    await models.CommentSubscription.findAll({
      where: {
        comment_id: payload.id,
        user_id: { [Op.not]: authorAddress.user_id ?? null },
      },
      attributes: ['user_id'],
    })
  ).map((c) => c.user_id);

  if (commentSubs.length > 0) {
  }
};
