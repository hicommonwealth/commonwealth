import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import type { Request, Response } from 'express';
import { Op } from 'sequelize';
import { success } from '../../types';
import { findAllRoles } from '../../util/roles';

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
  const userOwnedAddressIds = (await req.user.getAddresses())
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);
  if (!userOwnedAddressIds.includes(comment.address_id) && !req.user.isAdmin) {
    // is not author or site admin
    const roles = await findAllRoles(
      models,
      { where: { address_id: { [Op.in]: userOwnedAddressIds } } },
      comment.community_id,
      ['admin', 'moderator'],
    );
    const role = roles.find((r) => {
      return r.chain_id === comment.community_id;
    });
    if (!role) {
      throw new AppError(Errors.NotAdmin);
    }
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
