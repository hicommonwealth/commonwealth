import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import type { NextFunction, Request, Response } from 'express';
import { getLastEdited } from '../util/getLastEdited';
import { sanitizeDeletedComment } from '../util/sanitizeDeletedComment';

export const Errors = {
  NoRootId: 'Must provide thread_id',
};

const viewComments = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { community } = req;
  const threadId = req.query.thread_id as string;

  if (!threadId) {
    return next(new AppError(Errors.NoRootId));
  }

  const comments = await models.Comment.findAll({
    where: { community_id: community.id, thread_id: threadId },
    include: [
      models.Address,
      {
        model: models.Reaction,
        as: 'reactions',
        include: [
          {
            model: models.Address,
            as: 'Address',
            required: true,
          },
        ],
      },
    ],
    order: [['created_at', 'DESC']],
    paranoid: false,
  });

  const sanitizedComments = comments.map((c) => {
    const data = c.toJSON();
    return {
      ...sanitizeDeletedComment(data),
      last_edited: getLastEdited(data),
    };
  });

  return res.json({
    status: 'Success',
    result: sanitizedComments,
  });
};

export default viewComments;
