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

const getOtherStakeOverTime = async (models, req: Request, res: Response, next: NextFunction) => {
  const { chain, stash } = req.query;
  let { startDate, endDate } = req.query;
  let validators: any, OtherStakeOverTime: any;

  let singleValidatorHistoricalStats: {
    stash:string,
      historicalData:
        [{
          block_number:any,
          other_exposure:any
        }]
  };

  if (!chain) return next(new Error(Errors.ChainIdNotFound));

  const chainInfo = await models.Chain.findOne({ where: { id: chain } });

  if (!chainInfo) return next(new Error(Errors.InvalidChain));

  // Handling undefined Dates
  if (typeof startDate === 'undefined' || typeof endDate === 'undefined') {
    startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    startDate = new Date(startDate);
    endDate = new Date();
  }

  if (req.query.stash) { // If stash is given
    OtherStakeOverTime = await models.HistoricalValidatorStatistic.findAll({
      // To get all exposure of a validator between a time period
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

    if (!OtherStakeOverTime.length)
      return [];

    let singleValidator : typeof singleValidatorHistoricalStats;
    OtherStakeOverTime.forEach((value) => {
      const event_data: IEventData = value.dataValues.event_data;
      singleValidator.stash = event_data.stash.toString();
      singleValidator.historicalData.push({
        block_number: event_data.block_number,
        other_exposure: event_data.exposure.others.map((element) => { return element.value; }) });
    });

    return res.json({ status: 'Success', result: { singleValidator } });
  } else { // If stash isn't given
  // Getting all stashes from Validators Table (Unique)
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

    OtherStakeOverTime = await models.HistoricalValidatorStatistic.findAll({
      where:{
        '$ChainEventType.chain$': chain,
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [
        ['created_at', 'ASC']
      ],
      attributes: ['stash', 'exposure', 'block'],
      include: [ { model: models.ChainEventType } ]
    });

    if (!OtherStakeOverTime.length)
      return [];

    let allValidatorsHistoricalStats: [typeof singleValidatorHistoricalStats];

    OtherStakeOverTime.forEach((value) => {
      const event_data :IEventData = value.dataValues.event_data;
      const key = event_data.stash.toString();
      if (key in validators) {
        const index = allValidatorsHistoricalStats.findIndex((element) => element.stash.toString() === key);
        // Checking if current key already exisit
        if (index === -1) { // if not, then make a new key, with that stash, and then push historical data onto it.
          let thisValidator : typeof singleValidatorHistoricalStats;
          thisValidator.stash = key;
          thisValidator.historicalData.push({
            other_exposure:event_data.exposure.others.map((element) => { return element.value; }),
            block_number: event_data.block_number
          });
          allValidatorsHistoricalStats.push(thisValidator);
        } else {
          allValidatorsHistoricalStats[index].historicalData.push({ // If stash already exisits then push new element
            // in the array of json objects containing historical data
            other_exposure:event_data.exposure.others.map((element) => { return element.value; }),
            block_number: event_data.block_number
          });
        }
      }
    });

    return res.json({ status: 'Success', result: { allValidatorsHistoricalStats } });
  }
};

export default getOtherStakeOverTime;
