import { AppError } from '@hicommonwealth/adapters';
import type { DB } from '@hicommonwealth/model';
import type { Request, Response } from 'express';
import { validateOwner } from 'server/util/validateOwner';
import { success } from '../../types';

export const Errors = {
  InvalidCommentId: 'Comment ID invalid',
  NotLoggedIn: 'Not signed in',
  CommentNotFound: 'Could not find Comment',
  NotAdmin: 'Not an admin',
};

export default async (models: DB, req: Request, res: Response) => {
  const commentId = req.params.id;
  if (!commentId) {
    throw new AppError(Errors.InvalidCommentId);
  }

  if (!req.user) {
    throw new AppError(Errors.NotLoggedIn);
  }

  const comment = await models.Comment.findOne({
    where: {
      id: commentId,
    },
  });
  if (!comment) {
    throw new AppError(Errors.CommentNotFound);
  }

  const isAdminOrOwner = await validateOwner({
    models: models,
    user: req.user,
    entity: comment,
    communityId: comment.community_id,
    allowMod: true,
    allowAdmin: true,
    allowSuperAdmin: true,
  });
  if (!isAdminOrOwner) {
    throw new AppError(Errors.NotAdmin);
  }

  await comment.update({
    marked_as_spam_at: null,
  });

  // get comment with updated timestamp
  const updatedComment = await models.Comment.findOne({
    where: {
      id: comment.id,
    },
  });

  return success(res, updatedComment);
};
