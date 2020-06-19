import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

const getOffences = async (models, req: Request, res: Response, next: NextFunction) => {
  const { chain } = req.query;
  if (!chain) return next(new Error('Cannot find chain id'));

  const invites = await models.ChainEvent.findAll({
    where: {
      '$ChainEventType.chain$': chain,
      '$ChainEventType.event_name$': 'offence',
    },
    include: [
      { model: models.ChainEventType }
    ]
  });

  if (!invites) return res.json({ status: 'Failure' }); // No Invites

  return res.json({ status: 'Success', result: invites });
};

export default getOffences;
