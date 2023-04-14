import type { DB } from '../models';
import { ServerError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { uniqBy } from 'lodash';

const bulkReactions = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { thread_id, proposal_id, comment_id } = req.query;
  let reactions = [];
  try {
    if (thread_id || proposal_id || comment_id) {
      reactions = await models.Reaction.findAll({
        where: {
          thread_id: thread_id || null,
          proposal_id: proposal_id || null,
          comment_id: comment_id || null,
        },
        include: [models.Address],
        order: [['created_at', 'DESC']],
      });
    }
  } catch (err) {
    return next(new ServerError(err));
  }

  return res.json({
    status: 'Success',
    result: uniqBy(
      reactions.map((c) => c.toJSON()),
      'id'
    ),
  });
};

export default bulkReactions;
