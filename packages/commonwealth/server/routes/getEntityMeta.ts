import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import type { WhereOptions } from 'sequelize/types';
import type { ChainEntityMetaAttributes } from 'server/models/chain_entity_meta';
import type { DB } from '../models';

export const Errors = {
  NeedChainName: 'Must provide a chainName to fetch entities from',
  InvalidChain: 'Invalid chainName',
};

const getEntityMeta = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.query.chain_name) {
    return next(new AppError(Errors.NeedChainName));
  }

  const contract_address = req.query.contract_address || null;

  const entityMetaWhereOptions: WhereOptions<ChainEntityMetaAttributes> = {
    chain_name: req.query.chain_name,
    contract_address,
  };

  if (req.query.id) {
    entityMetaWhereOptions.id = req.query.id;
  }
  if (req.query.type_id) {
    entityMetaWhereOptions.type_id = req.query.type_id;
  }
  const entityMeta = await models.ChainEntityMeta.findAll({
    where: entityMetaWhereOptions,
  });
  return res.json({
    status: 'Success',
    result: entityMeta.map((e) => e.toJSON()),
  });
};

export default getEntityMeta;
