import { Response, NextFunction, Request } from 'express';
import { DB } from '../models';
import { AppError, ServerError } from '../util/errors';

const getSnapshotProposals = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const proposals = await models.Snap
}

export default getSnapshotProposals;

