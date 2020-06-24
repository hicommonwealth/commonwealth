import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { Errors } from './getOffences';
const log = factory.getLogger(formatFilename(__filename));
const Op = Sequelize.Op;

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
    include: [
      { model: models.ChainEventType }
    ]
  });
  const rewardList = rewards.map((reward) => reward.dataValues.event_data);
  // No rewards
  if (!rewardList) return next(new Error('Failure'));

  return res.json({ status: 'Success', result: rewardList });
};

export default getRewards;
