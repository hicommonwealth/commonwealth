import Sequelize from 'sequelize';
import moment from 'moment';
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { Errors } from './getOffences';

const log = factory.getLogger(formatFilename(__filename));
const Op = Sequelize.Op;

interface IReward {
  [key: string]: number
}

interface IEventData {
  kind?: string;
  amount: string;
  validator: string;
}

const getRewards = async (models, req: Request, res: Response, next: NextFunction) => {
  const { chain } = req.query;
  let { startDate, endDate } = req.query;

  if (!chain) return next(new Error(Errors.ChainIdNotFound));

  const chainInfo = await models.Chain.findOne({
    where: { id: chain }
  });
  if (!chainInfo) {
    return next(new Error(Errors.InvalidChain));
  }

  if (typeof startDate === 'undefined' || typeof endDate === 'undefined') {
    startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    startDate = new Date(startDate);
    endDate = new Date();
  }

  const rewards = await models.ChainEvent.findAll({
    where: {
      '$ChainEventType.chain$': chain,
      '$ChainEventType.event_name$': 'reward',
      created_at: {
        [Op.between]: [startDate, endDate]
      }
    },
    order: [
      ['created_at', 'ASC']
    ],
    include: [
      { model: models.ChainEventType }
    ]
  });

  let start = rewards[0].created_at;
  let end = rewards[rewards.length - 1].created_at;
  start = moment(start);
  end = moment(end);
  const daysDiff = end.diff(start, 'days');
  const validators: IReward = {};

  rewards.map((reward) => {
    const event_data: IEventData = reward.dataValues.event_data;
    validators[event_data.validator] = validators[event_data.validator] || 0;
    validators[event_data.validator] = +event_data.amount + validators[event_data.validator];
    return event_data;
  });
  // No rewards
  if (!rewards) return next(new Error('Failure'));

  return res.json({ status: 'Success', result: { daysDiff, validators } });
};

export default getRewards;
