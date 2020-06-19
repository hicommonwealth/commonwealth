import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

const getOffences = async (models, req: Request, res: Response, next: NextFunction) => {
  const { chain, startDate, endDate } = req.query;

  if (!chain) return next(new Error('Cannot find chain id'));

  const where: any = {
    '$ChainEventType.chain$': chain,
    '$ChainEventType.event_name$': 'offence'
  };
  if (startDate && endDate) {
    where.created_at = {
      $between: [startDate, endDate]
    };
  }
  const offences = await models.ChainEvent.findAll({
    where,
    include: [
      { model: models.ChainEventType }
    ]
  });

  if (!offences) return res.json({ status: 'Failure' }); // No Invites

  return res.json({ status: 'Success', result: offences });
};

export default getOffences;
