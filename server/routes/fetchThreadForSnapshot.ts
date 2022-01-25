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

  const threads = await models.OffchainThread.findAll({
    where: { 
      chain: chain,
      snapshot_proposal: snapshot,
    }
  });
  if (threads.length < 1) return res.json({ status: 'Failure' });
  
  return res.json({ status: 'Success', result: threads.map((thread) => { return { id: thread.id, title: thread.title } }) });
};

export default fetchThreadForSnapshot;
