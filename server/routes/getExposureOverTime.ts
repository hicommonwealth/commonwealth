import Sequelize from 'sequelize';
import { Exposure, BlockNumber, AccountId, IndividualExposure } from '@polkadot/types/interfaces';
import { Request, Response, NextFunction } from 'express';
import { Errors } from './getOffences';
const Op = Sequelize.Op;

interface IEventData {
  stash: AccountId;
  exposure: Exposure;
  block: BlockNumber;
}

// eslint-disable-next-line prefer-const
let validators: { [key: string]: { [block: string]: any } } = {};

// COMMON
const getStakeOverTime = async (models, req: Request, res: Response, next: NextFunction) => {
  const { chain, stash } = req.query;
  let { startDate, endDate } = req.query;

  // const tmp_chain: string = chain as unknown as string;
  // chain = tmp_chain.toLowerCase();
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

  const stakeOverTime = await models.HistoricalValidatorStatistic.findAll({
    where,
    order: [
      ['created_at', 'ASC']
    ],
    attributes: ['stash', 'exposure', 'block'],
  });
  return stakeOverTime;
};

const getTotalStakeOverTime = async (models, req: Request, res: Response, next: NextFunction) => {
  const stakeOverTime = await getStakeOverTime(models, req, res, next);

  stakeOverTime.forEach((stake) => {
    const event_data: IEventData = stake.dataValues;
    const key = event_data.stash.toString();

    if (!Object.prototype.hasOwnProperty.call(validators, key)) { validators[key] = {}; }
    validators[key][event_data.block.toString()] = Number(event_data.exposure.total);
  });
  return res.json({ status: 'Success', result: validators || {}, denom: 'EDG' });
};

const getOwnStakeOverTime = async (models, req: Request, res: Response, next: NextFunction) => {
  const stakeOverTime = await getStakeOverTime(models, req, res, next);

  stakeOverTime.forEach((stake) => {
    const event_data: IEventData = stake.dataValues;
    const key = event_data.stash.toString();

    if (!Object.prototype.hasOwnProperty.call(validators, key)) { validators[key] = {}; }
    validators[key][event_data.block.toString()] = Number(event_data.exposure.own);
  });

  return res.json({ status: 'Success', result: validators || {}, denom: 'EDG' });
};

const getOtherStakeOverTime = async (models, req: Request, res: Response, next: NextFunction) => {
  const stakeOverTime = await getStakeOverTime(models, req, res, next);
  const { onlyValue } = req.query;

  stakeOverTime.forEach((stake) => {
    const event_data: IEventData = stake.dataValues;
    const key = event_data.stash.toString();

    if (!Object.prototype.hasOwnProperty.call(validators, key)) { validators[key] = {}; }
    let nominatorValue: any = event_data.exposure.others;
    // eslint-disable-next-line max-len
    if (onlyValue) {
      nominatorValue = event_data.exposure.others.map(
        (q) => typeof (q.value) === 'string' ? parseInt(q.value, 16) : Number(q.value))
        .reduce((a: number, b: number) => a + b);
    }
    validators[key][event_data.block.toString()] = nominatorValue;
  });

  return res.json({ status: 'Success', result: validators || {}, denom: 'EDG' });
};

const getNominatorsOverTime = async (models, req: Request, res: Response, next: NextFunction) => {
  const stakeOverTime = await getStakeOverTime(models, req, res, next);
  const { onlyValue } = req.query;

  stakeOverTime.forEach((stake) => {
    const event_data: IEventData = stake.dataValues;
    const key = event_data.stash.toString();

    if (!Object.prototype.hasOwnProperty.call(validators, key)) { validators[key] = {}; }

    let nominatorValue: any = event_data.exposure.others.map((nominator) => nominator.who);
    // eslint-disable-next-line max-len
    if (onlyValue) {
      nominatorValue = nominatorValue.length.toString();
    }
    validators[key][event_data.block.toString()] = nominatorValue;
  });

  return res.json({ status: 'Success', result: validators || {} });
};

export { getTotalStakeOverTime, getOwnStakeOverTime, getOtherStakeOverTime, getNominatorsOverTime };
