import { Request, Response, NextFunction } from 'express';
import { DB } from '../database';

export const Errors = {
  NoThread: 'Cannot find thread',
  InvalidSnapshot: 'InvalidSnapshot ID',
  InvalidChain: 'No chain', 
};

const fetchThreadForSnapshot = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const { snapshot, chain } = req.query;
  if (!snapshot) return next(new Error(Errors.InvalidSnapshot));
  if (!chain) return next(new Error(Errors.InvalidChain));

  const thread = await models.OffchainThread.findAll({
    where: { 
      chain: chain,
      snapshot_proposal: snapshot,
    }
  });
  if (!thread) return res.json({ status: 'Failure', message: '' });
  
  return res.json({ status: 'Success', result: thread });
};

export default fetchThreadForSnapshot;
