import Sequelize from 'sequelize';
import { Exposure, BlockNumber, AccountId } from '@polkadot/types/interfaces';
import { Request, Response, NextFunction } from 'express';
import { Errors } from './getOffences';
const Op = Sequelize.Op;

interface IEventData {
    stash: AccountId;
    exposure: Exposure;
    block_number: BlockNumber;
}

const getOwnStakeOverTime = async (models, req: Request, res: Response, next: NextFunction) => {
  const { chain, stash } = req.query;
  let { startDate, endDate } = req.query;
  // TODO: Implement better data types
  let OwnStakeOverTime: any, ownStake: Array<any>, block: Array<any>, validators: any;
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

  // Data for all or a single stash (Validator)
  if (req.query.stash) { // If stash is given
    OwnStakeOverTime = await models.HistoricalValidatorStatistic.findAll({
      where:{
        '$ChainEventType.chain$': chain,
        '$HistoricalValidatorStatistic.stash': stash,
        // To get details between a time period
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
    // No Records found
    if (!OwnStakeOverTime.length)
      return next(new Error(Errors.NoRecordsFound));
    OwnStakeOverTime.forEach((stake) => {
      const event_data: IEventData = stake.dataValues.event_data;
      ownStake.push(event_data.exposure.own);
      block.push(event_data.block_number);
    });
    return res.json({ status: 'Success', result: { ownStake, block, stash } });
  } else {
    // GET UNIQUE STASH IDS FROM THE VALIDATORS TABLE AND GET ALL DATA FROM THE HistoricalValidatorStatistic TABLE
    // NEXT MAKE A JSON OBJECT OF THE DATA FROM IT, PUT A MAPPING TO MATCH THE KEY (STASH) FROM VALIDATORS TABLE TO
    // THE DATA FROM HistoricalValidatorStatistic TABLE, AND RETURN IT AS A JSON OBJECT, WHEN THE STASH IDs MATCH

    validators = await models.Validators.findAll({
      /* For validators that are active only
        where{
          '$Validators.state$': 'Active',
        }
      */
      attributes: [ 'stash' ]
    });

    if (!validators.length)
      return next(new Error(Errors.NoRecordsFound));

    validators.map((validator_stash) => {
      return validator_stash.stash;
    });

    OwnStakeOverTime = await models.HistoricalValidatorStatistic.findAll({
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

    const allValidatorsHistoricalStats : { [key:string]: any } = {};

    OwnStakeOverTime.forEach((value) => {
      const event_data: IEventData = value.dataValues.event_data;
      const key = event_data.stash.toString();
      if (key in validators) {
        allValidatorsHistoricalStats[key].push(event_data);
      }
    });
    return res.json({ status: 'Success', result: { allValidatorsHistoricalStats } });
  }

  // Please check the result return statement
};

export default getOwnStakeOverTime;
