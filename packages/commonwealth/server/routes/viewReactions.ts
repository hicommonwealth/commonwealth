/* eslint-disable dot-notation */
import { Request, Response, NextFunction } from 'express';
import { Action } from 'common-common/src/permissions';
import { AppError, ServerError } from 'common-common/src/errors';
import validateChain from '../middleware/validateChain';
import { DB } from '../models';
import { checkReadPermitted } from '../util/roles';

export const Errors = {
  NoCommentOrThreadId: 'Must provide a comment or thread ID',
};

const viewReactions = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.query);
  if (error) return next(new AppError(error));

  try{
    await checkReadPermitted(
        models,
        chain.id,
        Action.VIEW_REACTIONS,
        req.user?.id,
      );
  } catch(err) {
    return next(new ServerError(err));
  }
  
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
