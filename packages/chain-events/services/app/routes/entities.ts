import type { Response, NextFunction, Request } from 'express';
import { AppError, ServerError } from 'common-common/src/errors';

import type { DB } from '../../database/database';

export const Errors = {
  NeedChain: 'Must provide a chain to fetch entities from',
};

const entities: any = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.query.chain) {
    return next(new AppError(Errors.NeedChain));
  }

  const entityFindOptions: any = {
    include: [
      {
        model: models.ChainEvent,
        order: [[models.ChainEvent, 'id', 'asc']],
      },
    ],
    order: [['created_at', 'DESC']],
    where: {
      chain: req.query.chain,
    },
  };
  if (req.query.id) {
    entityFindOptions.where.id = req.query.id;
  }
  if (req.query.type) {
    entityFindOptions.where.type = req.query.type;
  }
  if (req.query.type_id) {
    entityFindOptions.where.type_id = req.query.type_id;
  }
  if (req.query.completed) {
    entityFindOptions.where.completed = true;
  }

  try {
    const fetchedEntities = await models.ChainEntity.findAll(entityFindOptions);
    return res.json({
      status: 'Success',
      result: fetchedEntities.map((e) => e.toJSON()),
    });
  } catch (err) {
    console.error(err);
    return next(new ServerError(`Failed to fetch entities from DB`, err));
  }
};

export default entities;
