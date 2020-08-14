import Sequelize from 'sequelize';
import { Exposure, BlockNumber, AccountId, ValidatorPrefs } from '@polkadot/types/interfaces';
import { Request, Response, NextFunction } from 'express';
import { Errors } from './getOffences';
const Op = Sequelize.Op;

interface IEventData {
    stash: AccountId;
    exposure: Exposure;
    block_number: BlockNumber;
}

const getTotalStakeOverTime = async (models, req: Request, res: Response, next: NextFunction) => {
  const { chain, stash } = req.query;
  let { startDate, endDate } = req.query;
  let validators: any;
  const chainInfo = await models.Chain.findOne({
    where: { id: chain }
  });
  // Handling Errors
  if (!chain) return next(new Error(Errors.ChainIdNotFound));
  if (!chainInfo) {
    return next(new Error(Errors.InvalidChain));
  }
  // Handling undefined Dates
  if (typeof startDate === 'undefined' || typeof endDate === 'undefined') {
    startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    startDate = new Date(startDate);
    endDate = new Date();
  }

  if (req.query.stash) {
    const TotalStakeOverTime = await models.HistoricalValidatorStatistic.findAll({
      // To get all exposure of validator between a time period
      where: {
        '$ChainEventType.chain$': chain,
        '$HistoricalValidatorStatistic.stash': stash,
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: ['stash', 'exposure', 'block'],
      order: [
        ['created_at', 'ASC']
      ],
      include: [ { model: models.ChainEventType } ]
    });

    if (!TotalStakeOverTime.length)
      return [];

    const totalStake = [];
    const block = [];
    TotalStakeOverTime.forEach((value) => {
      const event_data: IEventData = value.dataValues.event_data;
      totalStake.push(event_data.exposure.total);
      block.push(event_data.block_number);
    });
    // Please check the result return statement
    return res.json({ status: 'Success', result: { totalStake, block } });
  } else {
    validators = await models.Validators.findAll({
      /* For validators that are active only
        where{
          '$Validators.state$': 'Active',
        }
      */
      attributes: [ 'stash' ]
    });

    if (!validators.length) return ['Validator Table Empty'];

    validators.map((value) => {
      return value.stash;
    });

    const TotalStakeOverTime = await models.HistoricalValidatorStatistic.findAll({
      // To get all exposure of validator between a time period
      where: {
        '$ChainEventType.chain$': chain,
        '$HistoricalValidatorStatistic.stash': stash,
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: ['stash', 'exposure', 'block'],
      order: [
        ['created_at', 'ASC']
      ],
      include: [ { model: models.ChainEventType } ]
    });

    if (!TotalStakeOverTime.length)
      return [];

    const allValidatorsHistoricalStats : {
        [stash:string]: {
        total_exposure:any,
        blk_number:any
      }} = {};

    TotalStakeOverTime.forEach((value) => {
      const event_data :IEventData = value.dataValues.event_data;
      const key = event_data.stash.toString();
      if (key in validators) {
        allValidatorsHistoricalStats[key].total_exposure.push(event_data.exposure.total);
        allValidatorsHistoricalStats[key].blk_number.push(event_data.block_number);
      }
    });
  }
};

export default getTotalStakeOverTime;
