import Sequelize from 'sequelize';
import BN from 'bn.js';
import moment from 'moment';
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { Errors } from './getOffences';

const log = factory.getLogger(formatFilename(__filename));
const Op = Sequelize.Op;

interface IEventData {
  kind?: string;
  amount: string;
  validator: string;
}

const getRewards = async (models, req: Request, res: Response, next: NextFunction) => {
  const { chain } = req.query;
  let { startDate, endDate } = req.query;

  if (!chain) return next(new Error(Errors.ChainIdNotFound));

  let eraLengthInHours;
  if (chain === 'edgeware') {
    eraLengthInHours = 6;
  } else if (chain === 'kusama') {
    eraLengthInHours = 6;
  }

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
  const diff = end.diff(start, 'days');
  // No rewards
  if (!rewards.length)
    return next(new Error(Errors.NoRecordsFound));

  const total: BN = rewards.reduce((prev, curr) => {
    const event_data: IEventData = curr.dataValues.event_data;
    return prev.add(new BN(event_data.amount));
  }, new BN(0));

  return res.json({
    status: 'Success',
    result: {
      diff,
      avgReward: total.div(new BN(diff)).toString(),
    }
  });
};

export default getRewards;
