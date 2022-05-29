import { Request, Response, NextFunction } from 'express';
import validateChain from '../util/validateChain';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';
import { getLastEdited } from '../util/getLastEdited';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoRootId: 'Must provide root_id',
};

const viewComments = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.query);
  if (error) return next(new Error(error));

  if (!req.query.root_id) {
    return next(new Error(Errors.NoRootId));
  }

  const comments = await models.OffchainComment.findAll({
    where: { chain: chain.id, root_id: req.query.root_id },
    include: [
      models.Address,
      models.Attachment,
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
