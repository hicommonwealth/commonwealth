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

const getNominatorsOverTime = async (models, req: Request, res: Response, next: NextFunction) => {
  const { chain, stash } = req.query;
  let { startDate, endDate } = req.query;
  const chainInfo = await models.Chain.findOne({
    where: { id: chain }
  });
  let validators: any, NominatorsOverTime: any;

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

    const nominators : { [key:string]:any } = {};

    NominatorsOverTime.forEach((value) => {
      const event_data: IEventData = value.dataValues.event_data;
      const key = event_data.block_number.toString();
      nominators[key].push(event_data.exposure.others);
    });
    return res.json({ status: 'Success', result: { stash, nominators } });
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

    validators.map((value) => {
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

    const allValidatorsHistoricalStats : {
      [stash:string]: {
        other_exposure:any,
      blk_number:any
    }} = {};

    NominatorsOverTime.forEach((value) => {
      const event_data :IEventData = value.dataValues.event_data;
      const key = event_data.stash.toString();
      if (key in validators) {
        allValidatorsHistoricalStats[key].other_exposure.push(event_data.exposure.others.map((individualExposure) => {
          return individualExposure.who;
        }));
        allValidatorsHistoricalStats[key].blk_number.push(event_data.block_number);
      }
    });

    return res.json({ status: 'Success', result: { allValidatorsHistoricalStats } });
  }
};

export default getNominatorsOverTime;
