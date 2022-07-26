import { Request, Response, NextFunction } from 'express';
import validateChain from '../util/validateChain';
import { factory, formatFilename } from 'common-common/src/logging';
import { DB } from '../database';
import { getLastEdited } from '../util/getLastEdited';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoThreadId: 'Must provide thread_id',
};

const viewComments = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.query);
  if (error) return next(new Error(error));

  if (!req.query.thread_id) {
    return next(new Error(Errors.NoThreadId));
  }

  const comments = await models.OffchainComment.findAll({
    where: { chain: chain.id, thread_id: req.query.thread_id },
    include: [
      models.Address,
      models.OffchainAttachment,
      {
        model: models.OffchainReaction,
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
  return res.json({
    status: 'Success',
    result: comments.map((c) => {
      const row = c.toJSON();
      const last_edited = getLastEdited(row);
      row['last_edited'] = last_edited;
      return row;
    }),
  });
};

export default viewComments;
