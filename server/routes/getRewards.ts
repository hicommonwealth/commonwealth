/* eslint-disable guard-for-in */
import Sequelize from 'sequelize';
import BN from 'bn.js';
// import _ from 'lodash';
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
  const { chain, stash_id } = req.query;
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

  // if start and end date isn't given, we set it for 30 days for now
  if (typeof startDate === 'undefined' || typeof endDate === 'undefined') {
    endDate = new Date();
    startDate = new Date();
    endDate = endDate.toISOString(); // 2020-08-08T12:46:32.276Z FORMAT // today's date
    startDate.setDate(startDate.getDate() - 30);
    startDate = startDate.toISOString(); // 2020-08-08T12:46:32.276Z FORMAT // 30 days ago date
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

  const validators: { [key: string]: any[] } = {};

  rewards.forEach((reward) => {
    const event_data: IEventData = reward.dataValues.event_data;
    const key = event_data.validator || chain;
    if (key in validators) {
      if (validators[key].findIndex((elt) => (elt.block_number === reward.block_number)) === -1) {
        validators[key].push(reward);
      }
    } else {
      validators[key] = [reward];
    }
  });

  if (stash_id)
    return res.json({ status: 'Success', result: { validator: validators[stash_id] || [] } });
  return res.json({ status: 'Success', result: { validators: validators || [] } });
};

export default getRewards;
