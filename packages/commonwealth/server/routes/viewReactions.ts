/* eslint-disable dot-notation */
import { AppError } from 'common-common/src/errors';
import { factory, formatFilename } from 'common-common/src/logging';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../models';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoCommentOrThreadId: 'Must provide a comment or thread ID',
};

const viewReactions = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const chain = req.chain;

  if (!req.query.thread_id && !req.query.comment_id) {
    return next(new AppError(Errors.NoCommentOrThreadId));
  }

  const options = { chain: chain.id };

  if (req.query.thread_id) options['thread_id'] = req.query.thread_id;

  let reactions;
  try {
    reactions = await models.Reaction.findAll({
      where: options,
      include: [models.Address],
      order: [['created_at', 'DESC']],
    });
  } catch (err) {
    return next(new AppError(err));
  }

  return res.json({
    status: 'Success',
    result: reactions.map((c) => c.toJSON()),
  });
};

export default viewReactions;
