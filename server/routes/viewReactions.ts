/* eslint-disable dot-notation */
import { Request, Response, NextFunction } from 'express';
import validateChain from '../util/validateChain';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoCommentOrThreadId: 'Must provide a comment or thread ID',
};

const viewReactions = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const [chain, error] = await validateChain(models, req.query);
  if (error) return next(new Error(error));

  if (!req.query.thread_id && !req.query.comment_id) {
    return next(new Error(Errors.NoCommentOrThreadId));
  }

  const options = { chain: chain.id };

  if (req.query.thread_id) options['thread_id'] = req.query.thread_id;

  let reactions;
  try {
    reactions = await models.Reaction.findAll({
      where: options,
      include: [ models.Address ],
      order: [['created_at', 'DESC']],
    });
  } catch (err) {
    return next(new Error(err));
  }

  return res.json({ status: 'Success', result: reactions.map((c) => c.toJSON()) });
};

export default viewReactions;
