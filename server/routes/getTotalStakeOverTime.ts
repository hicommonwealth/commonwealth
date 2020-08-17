import Sequelize from 'sequelize';
import { Exposure, BlockNumber, AccountId, ValidatorPrefs } from '@polkadot/types/interfaces';
import { Request, Response, NextFunction } from 'express';
import { elementAt } from 'rxjs/operators';
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

  if (!chain) return next(new Error(Errors.ChainIdNotFound));

  const chainInfo = await models.Chain.findOne({ where: { id: chain } });

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

  let singleValidatorHistoricalData : {
    stash:string,
    historicalData:[{
      block_number:any,
      total_exposure:any
    }]
  };

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

    let singleValidator : typeof singleValidatorHistoricalData;
    TotalStakeOverTime.forEach((value) => {
      const event_data: IEventData = value.dataValues.event_data;
      singleValidator.stash = event_data.stash.toString();
      singleValidator.historicalData.push({
        block_number:event_data.block_number,
        total_exposure:event_data.exposure.total });
    });
    // Please check the result return statement
    return res.json({ status: 'Success', result: { singleValidator } });
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

    validators = validators.map((value) => {
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

    let allValidatorsHistoricalStats : [typeof singleValidatorHistoricalData];

    TotalStakeOverTime.forEach((value) => {
      const event_data :IEventData = value.dataValues.event_data;
      const key = event_data.stash.toString();
      const index = allValidatorsHistoricalStats.findIndex((element) => element.stash.toString() === key);
      if (key in validators) {
        if (index === -1) { // Means that this validator isn't present in allValidatorsHistoricalStats
        // so we need to add one
          let thisValidator: typeof singleValidatorHistoricalData;
          thisValidator.stash = key;
          thisValidator.historicalData.push({
            block_number: event_data.block_number,
            total_exposure:event_data.exposure.total
          });
          allValidatorsHistoricalStats.push(thisValidator);
        } else {
          allValidatorsHistoricalStats[index].historicalData.push({
            block_number: event_data.block_number,
            total_exposure: event_data.exposure.total
          });
        }
      }
    });
    return res.json({ status: 'Success', result: { allValidatorsHistoricalStats } });
  }
};

export default getTotalStakeOverTime;
