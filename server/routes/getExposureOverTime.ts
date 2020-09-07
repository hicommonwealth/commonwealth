import Sequelize from 'sequelize';
import { Exposure, BlockNumber, AccountId, IndividualExposure } from '@polkadot/types/interfaces';
import { Request, Response, NextFunction } from 'express';
import { Errors } from './getOffences';
const Op = Sequelize.Op;

interface IEventData {
    stash: AccountId;
    exposure: Exposure;
    block_number: BlockNumber;
}

// eslint-disable-next-line prefer-const
let validators: { [key: string]: any[] } = {};

// COMMON
const getStakeOverTime = async (models, req: Request, res: Response, next: NextFunction) => {
  const { chain, stash } = req.query;
  let { startDate, endDate } = req.query;

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

  const where: any = {
    '$ChainEventType.chain$': chain,
  };

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
    include: [ { model: models.ChainEventType } ]
  });
  return stakeOverTime;
};

const getTotalStakeOverTime = async (models, req: Request, res: Response, next: NextFunction) => {
  const stakeOverTime = await getStakeOverTime(models, req, res, next);
  validators = {};

  if (stakeOverTime) { if (!stakeOverTime.length) return []; } else { return []; }

  stakeOverTime.forEach((stake) => {
    const event_data: IEventData = stake.dataValues.event_data;
    const key = event_data.stash.toString();
    if (key in validators) {
      if (validators[key].findIndex((element) => (element.stash.toString() === key)) === -1) {
        validators[key].push([event_data.block_number, event_data.exposure.total]);
      }
    } else {
      validators[key] = [event_data.block_number, event_data.exposure.total];
    }
  });

  return res.json({ status: 'Success', result: { validators } });
};

const getOwnStakeOverTime = async (models, req: Request, res: Response, next: NextFunction) => {
  const stakeOverTime = await getStakeOverTime(models, req, res, next);
  validators = {};

  if (stakeOverTime) { if (!stakeOverTime.length) return []; } else { return []; }

  stakeOverTime.forEach((stake) => {
    const event_data: IEventData = stake.dataValues.event_data;
    const key = event_data.stash.toString();
    if (key in validators) {
      if (validators[key].findIndex((element) => (element.stash.toString() === key)) === -1) {
        validators[key].push([event_data.block_number, event_data.exposure.own]);
      }
    } else {
      validators[key] = [event_data.block_number, event_data.exposure.own];
    }
  });

  return res.json({ status: 'Success', result: { validators } });
};

const getOtherStakeOverTime = async (models, req: Request, res: Response, next: NextFunction) => {
  const stakeOverTime = await getStakeOverTime(models, req, res, next);
  validators = {};

  if (stakeOverTime) { if (!stakeOverTime.length) return []; } else { return []; }

  stakeOverTime.forEach((stake) => {
    const event_data: IEventData = stake.dataValues.event_data;
    const key = event_data.stash.toString();
    if (key in validators) {
      if (validators[key].findIndex((element) => (element.stash.toString() === key)) === -1) {
        validators[key].push([event_data.block_number, event_data.exposure.others]);
      }
    } else {
      validators[key] = [event_data.block_number, event_data.exposure.others];
    }
  });

  return res.json({ status: 'Success', result: { validators } });
};

const getNominatorsOverTime = async (models, req: Request, res: Response, next: NextFunction) => {
  const stakeOverTime = await getStakeOverTime(models, req, res, next);
  validators = {};

  if (stakeOverTime) { if (!stakeOverTime.length) return []; } else { return []; }

  stakeOverTime.forEach((stake) => {
    const event_data: IEventData = stake.dataValues.event_data;
    const key = event_data.stash.toString();
    if (key in validators) {
      if (validators[key].findIndex((element) => (element.stash.toString() === key)) === -1) {
        validators[key].push([event_data.block_number, event_data.exposure.others.map((nominator) => {
          return nominator.who;
        })]);
      }
    } else {
      validators[key] = [event_data.block_number, event_data.exposure.others.map((nominator) => {
        return nominator.who;
      })];
    }
  });
  const nominators = validators;
  return res.json({ status: 'Success', result: { nominators } });
};

export { getTotalStakeOverTime, getOwnStakeOverTime, getOtherStakeOverTime, getNominatorsOverTime };
