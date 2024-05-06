import { EventHandler } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { ZodUndefined } from 'zod';

export const processCommentCreated: EventHandler<
  'CommentCreated',
  ZodUndefined
> = async ({ payload }) => {
  await models.CommentSubscription.findAll({
    where: {
      comment_id: payload.id,
    },
  });
};
