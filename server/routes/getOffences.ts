import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));
const Op = Sequelize.Op;

export const Errors = {
  InvalidChain: 'Invalid chain',
  ChainIdNotFound: 'Cannot find chain id',
  NoRecordsFound: 'No records found',
};

const getOffences = async (models, req: Request, res: Response, next: NextFunction) => {
  const { chain, startDate, endDate, stash } = req.query;

  if (!chain) return next(new Error(Errors.ChainIdNotFound));

  const chainInfo = await models.Chain.findOne({
    where: { id: chain }
  });
  if (!chainInfo) {
    return next(new Error(Errors.InvalidChain));
  }

  const where: any = {
    '$ChainEventType.chain$': chain,
    '$ChainEventType.event_name$': 'offence'
  };
  if (startDate && endDate) {
    where.created_at = {
      [Op.between]: [startDate, endDate]
    };
  }
  const offences = await models.ChainEvent.findAll({
    where,
    include: [
      { model: models.ChainEventType }
    ]
  });

  return res.json({ status: 'Success', result: offences || [] });
};

export default getOffences;
