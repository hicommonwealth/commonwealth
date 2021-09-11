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

  const thread = await models.OffchainThread.findOne({
    where: { 
      chain: chain,
      snapshot_proposal: snapshot,
    },
    include: [
      {
        model: models.Address,
        as: 'Address'
      },
      {
        model: models.Address,
        // through: models.Collaboration,
        as: 'collaborators'
      },
      {
        model: models.OffchainTopic,
        as: 'topic'
      },
      {
        model: models.ChainEntity,
      },
      {
        model: models.OffchainReaction,
        as: 'reactions',
        include: [{
          model: models.Address,
          as: 'Address'
        }]
      }
    ],
  });
  if (!thread) return res.json({ status: 'Failure', message: Errors.NoThread });

  return res.json({ status: 'Success', result: thread.toJSON() });
};

export default fetchThreadForSnapshot;
