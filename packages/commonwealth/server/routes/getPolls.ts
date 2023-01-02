import { Request, Response, NextFunction } from 'express';
import validateChain from '../middleware/validateChain';
import { factory, formatFilename } from 'common-common/src/logging';
import { DB } from '../models';
import { AppError, ServerError } from 'common-common/src/errors';
import { checkReadPermitted } from 'server/util/roles';
import { Action } from 'common-common/src/permissions';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoThreadId: 'Must provide thread_id',
};

const getPolls = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.query);
  if (error) return next(new AppError(error));

  await checkReadPermitted(
    models,
    chain.id,
    Action.VIEW_POLLS,
    req.user?.id,
  );

  const { thread_id } = req.query;
  if (!thread_id) return next(new AppError(Errors.NoThreadId));

  const polls = await models.Poll.findAll({
    where: { thread_id },
    include: { model: models.Vote, as: 'votes' },
  });

  return res.json({
    status: 'Success',
    result: polls.map((poll) => poll.toJSON()),
  });
};

export default getPolls;
