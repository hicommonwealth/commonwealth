import Sequelize from 'sequelize';
import { Exposure, BlockNumber, AccountId, IndividualExposure } from '@polkadot/types/interfaces';
import { Request, Response, NextFunction } from 'express';
import { Errors } from './getOffences';
const Op = Sequelize.Op;
interface IEventData {
  stash: AccountId;
  uptime: number;
  block: BlockNumber;
}

// COMMON
const getImOnline = async (models, req: Request, res: Response, next: NextFunction) => {
  const { stash } = req.query;
  let { startDate, endDate } = req.query;
  // eslint-disable-next-line prefer-const
  let validators: { [key: string]: { [block: string]: any } } = {};

  const { chain } = req.query;
  if (!chain) return next(new Error(Errors.ChainIdNotFound));
  const chainInfo = await models.Chain.findOne({ where: { id: chain } });
  if (!chainInfo) return next(new Error(Errors.InvalidChain));
  // if start and end date isn't given, we set it for 30 days for now
  if (typeof startDate === 'undefined' || typeof endDate === 'undefined') {
    endDate = new Date();
    startDate = new Date();
    endDate = endDate.toISOString(); // 2020-08-08T12:46:32.276Z FORMAT // today's date
    startDate.setDate(startDate.getDate() - 30);
    startDate = startDate.toISOString(); // 2020-08-08T12:46:32.276Z FORMAT // 30 days ago date
  }
  const where: any = {};
  // if stash is given
  if (stash) where['$HistoricalValidatorStatistic.stash$'] = stash;
  if (startDate && endDate) {
    where.created_at = {
      [Op.between]: [startDate, endDate]
    };
  }
  const stakeImOnlineOverTime = await models.HistoricalValidatorStatistic.findAll({
    where,
    order: [
      ['created_at', 'DESC']
    ],
    attributes: ['stash', 'block', 'uptime']
  });

  stakeImOnlineOverTime.forEach((element) => {
    const event_data: IEventData = element.dataValues;
    const key = event_data.stash.toString();

    if (!Object.prototype.hasOwnProperty.call(validators, key)) { validators[key] = {}; }
    validators[key][event_data.block.toString()] = event_data.uptime;
  });
  return res.json({ status: 'Success', result: validators || {}  });
};

export default getImOnline;
