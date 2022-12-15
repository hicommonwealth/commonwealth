import { Response, NextFunction, Request } from 'express';
import {AppError} from "common-common/src/errors";
import { WhereOptions } from 'sequelize/types';
import { ChainEntityMetaAttributes } from 'server/models/chain_entity_meta';
import { DB } from '../models';

export const Errors = {
  NeedChain: 'Must provide a chain to fetch entities from',
  InvalidChain: 'Invalid chain',
};

const getEntityMeta = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  if (!req.query.chain) {
    return next(new AppError(Errors.NeedChain));
  }

  const chain = await models.Chain.findOne({
    where: { id: req.query.chain }
  });

  if (!chain) {
    return next(new AppError(Errors.InvalidChain));
  }

  const entityMetaWhereOptions: WhereOptions<ChainEntityMetaAttributes> = {
    chain: chain.id,
  };
  if (req.query.id) {
    entityMetaWhereOptions.id = req.query.id;
  }
  if (req.query.type_id) {
    entityMetaWhereOptions.type_id = req.query.type_id;
  }
  const entityMeta = await models.ChainEntityMeta.findAll({
    where: entityMetaWhereOptions,
    include: [
      {
        model: models.Thread,
        attributes: ['title'],
      }
    ],
  });
  return res.json({ status: 'Success', result: entityMeta.map((e) => e.toJSON()) });
};

export default getEntityMeta;
