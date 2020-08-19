import Sequelize from 'sequelize';
import { Exposure, BlockNumber, AccountId } from '@polkadot/types/interfaces';
import { Request, Response, NextFunction } from 'express';
import { elementAt } from 'rxjs/operators';
import { Errors } from './getOffences';
const Op = Sequelize.Op;

interface IEventData {
    stash: AccountId;
    exposure: Exposure;
    block_number: BlockNumber;
}

const getNominatorsOverTime = async (models, req: Request, res: Response, next: NextFunction) => {
  const { chain, stash } = req.query;
  let { startDate, endDate } = req.query;
  let validators: any, NominatorsOverTime: any;

  if (!chain) return next(new Error(Errors.ChainIdNotFound));

  const chainInfo = await models.Chain.findOne({ where: { id: chain } });

  let singleValidatorHistoricalData : {
    stash:string,
    historicalData: [{
      block_number:any,
      nominators:any
    }]
  };

  // Handling Errors
  if (!chainInfo) return next(new Error(Errors.InvalidChain));

  // Handling undefined Dates
  if (typeof startDate === 'undefined' || typeof endDate === 'undefined') {
    startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    startDate = new Date(startDate);
    endDate = new Date();
  }

  if (req.query.stash) { // If stash is given
    NominatorsOverTime = await models.HistoricalValidatorStatistic.findAll({
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

    if (!NominatorsOverTime.length)
      return [];

    let singleValidator : typeof singleValidatorHistoricalData;
    NominatorsOverTime.forEach((value) => {
      const event_data: IEventData = value.dataValues.event_data;
      singleValidator.stash = event_data.stash.toString();
      singleValidator.historicalData.push({ block_number:event_data.block_number,
        nominators: event_data.exposure.others.map((IndividualExposure) => {
          return IndividualExposure.who;
        }) });
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

    NominatorsOverTime = await models.HistoricalValidatorStatistic.findAll({
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

    if (!NominatorsOverTime.length)
      return [];

    let allValidatorsHistoricalStats : [typeof singleValidatorHistoricalData];

    NominatorsOverTime.forEach((value) => {
      const event_data: IEventData = value.dataValues.event_data;
      const key = event_data.stash.toString();
      const index = allValidatorsHistoricalStats.findIndex((element) => element.stash.toString() === key);
      if (key in validators) {
        if (index === -1) {
          let thisValidator: typeof singleValidatorHistoricalData;
          thisValidator.stash = key;
          thisValidator.historicalData.push({
            block_number:event_data.block_number,
            nominators: event_data.exposure.others.map((element) => { return element.who; })
          });
          allValidatorsHistoricalStats.push(thisValidator);
        }
      } else {
        allValidatorsHistoricalStats[index].historicalData.push({
          block_number:event_data.block_number,
          nominators:event_data.exposure.others.map((element) => { return element.who; })
        });
      }
    });

    return res.json({ status: 'Success', result: { allValidatorsHistoricalStats } });
  }
};

export default getNominatorsOverTime;
