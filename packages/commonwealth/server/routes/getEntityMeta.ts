import { Response, NextFunction, Request } from 'express';
import { DB } from '../database';

export const Errors = {
  NeedChain: 'Must provide a chain to fetch entities from',
  InvalidChain: 'Invalid chain',
};

const getEntityMeta = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  if (!req.query.chain) {
    return next(new Error(Errors.NeedChain));
  }

  const chain = await models.Chain.findOne({
    where: { id: req.query.chain }
  });

  if (!chain) {
    return next(new Error(Errors.InvalidChain));
  }

  const entityMetaFindOptions: any = {
    include: [
      {
        model: models.Thread,
        attributes: ['title'],
      }
    ],
    where: {
      chain: req.query.chain,
    }
  };
  if (req.query.id) {
    entityMetaFindOptions.where.id = req.query.id;
  }
  const entityMeta = await models.ChainEntityMeta.findAll(entityMetaFindOptions);
  return res.json({ status: 'Success', result: entityMeta.map((e) => e.toJSON()) });
};

export default getEntityMeta;
