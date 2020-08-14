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
  const chainInfo = await models.Chain.findOne({
    where: { id: chain }
  });
  let validators: any, OtherStakeOverTime: any;

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
      return next(new Error(Errors.NoRecordsFound));

    const othersStake : { [key:string]:any } = {};
    OtherStakeOverTime.forEach((value) => {
      const event_data: IEventData = value.dataValues.event_data;
      const key = event_data.block_number.toString();
      othersStake[key].push(event_data.exposure.others);
    });
    // Please check the result return statement
    return res.json({ status: 'Success', result: { stash, othersStake } });
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
      return next(new Error(Errors.NoRecordsFound));

    const allValidatorsHistoricalStats : {
      [stash:string]: {
      other_exposure:any,
      blk_number:any
    }} = {};

    OtherStakeOverTime.forEach((value) => {
      const event_data :IEventData = value.dataValues.event_data;
      const key = event_data.stash.toString();
      if (key in validators) {
        allValidatorsHistoricalStats[key].other_exposure.push(event_data.exposure.others);
        allValidatorsHistoricalStats[key].blk_number.push(event_data.block_number);
      }
    });

    return res.json({ status: 'Success', result: { allValidatorsHistoricalStats } });
  }
};

export default getOtherStakeOverTime;
