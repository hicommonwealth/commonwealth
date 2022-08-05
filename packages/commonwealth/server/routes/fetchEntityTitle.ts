import { Request, Response, NextFunction } from 'express';
import { DB } from '../database';

export const Errors = {
  NoEntity: 'Cannot find entity',
};

const fetchEntityTitle = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const { chain_entity_id } = req.query;

  const entityMeta = await models.ChainEntityMeta.findOne({
    where: {
      ce_id: chain_entity_id
    }
  })
  if (!entityMeta) return res.json({ status: 'Failure', message: Errors.NoEntity });

  return res.json({ status: 'Success', result: (entityMeta.title || '') });
};

export default fetchEntityTitle;
