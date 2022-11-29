import { Request, Response, NextFunction } from 'express';
import { uniqBy } from 'lodash';
import { factory, formatFilename } from 'common-common/src/logging';
import { Action } from 'common-common/src/permissions';
import { DB } from '../models';
import { AppError, ServerError } from '../util/errors';
import { checkReadPermitted } from '../util/roles';

const log = factory.getLogger(formatFilename(__filename));

const bulkReactions = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const { thread_id, proposal_id, comment_id, chain_id } = req.query;
  await checkReadPermitted(
    models,
    chain_id,
    Action.VIEW_REACTIONS,
    req.user?.id,
  );
  let reactions = [];
  try {
    if (thread_id || proposal_id || comment_id) {
      reactions = await models.Reaction.findAll({
        where: {
          thread_id: thread_id || null,
          proposal_id: proposal_id || null,
          comment_id: comment_id || null
        },
        include: [ models.Address ],
        order: [['created_at', 'DESC']],
      });
    }
  } catch (err) {
    return next(new ServerError(err));
  }

  return res.json({ status: 'Success', result: uniqBy(reactions.map((c) => c.toJSON()), 'id') });
};

export default bulkReactions;
