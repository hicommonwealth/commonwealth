import { Request, Response, NextFunction } from 'express';
import proposalIdToEntity from '../util/proposalIdToEntity';
import { DB } from '../database';

export const Errors = {
  NoEntity: 'Cannot find entity',
};

const fetchEntityTitle = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const { unique_id, chain } = req.query;

  const entity = await proposalIdToEntity(models, chain as string, unique_id as string);
  if (!entity) return res.json({ status: 'Failure', message: Errors.NoEntity });

  return res.json({ status: 'Success', result: (entity.title || '') });
};

export default fetchEntityTitle;
