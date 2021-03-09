import { Request, Response, NextFunction } from 'express';
import proposalIdToEntity from '../util/proposalIdToEntity';

export const Errors = {
  NoEntity: 'Cannot find entity',
  NotAdminOrOwner: 'Not an admin or owner of this entity',
};

const fetchEntityTitle = async (models, req: Request, res: Response, next: NextFunction) => {
  const { unique_id, chain } = req.body;

  const entity = await proposalIdToEntity(models, chain, unique_id);
  if (!entity) return next(new Error(Errors.NoEntity));

  return res.json({ status: 'Success', result: (entity.title || '').toJSON() });
};

export default fetchEntityTitle;
