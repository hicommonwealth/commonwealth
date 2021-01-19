import { Request, Response, NextFunction } from 'express';
import { sequelize } from '../database';

export const Errors = {
  InvalidChain: 'Invalid chain',
  ChainIdNotFound: 'Cannot find chain id',
  NoRecordsFound: 'No records found',
};


const getGlobalStatistics = async (models, req: Request, res: Response, next: NextFunction) => {
  let result: any = [];
  let totalStaked = 0;
  let elected: number = 0;
  let waiting: number = 0;
  let apr = 0.0;
  const nominators: string[] = [];

  const { chain } = req.query;
  if (!chain) return next(new Error(Errors.ChainIdNotFound));

  const chainInfo = await models.Chain.findOne({
    where: { id: chain }
  });

  const where: any = {
    chain_event_type_id: `${chain}-offences-offence`
  };

  const offences = await models.ChainEvent.count({
    where
  });

  const rawQuery = `
  select p.*, v.state, v."lastUpdate", v."sessionKeys" , v."name"
  from "Validator" v  
  left join (
    SELECT * ,ROW_NUMBER() OVER( PARTITION BY partitionTable.stash ORDER BY created_at DESC )
    FROM public."HistoricalValidatorStatistic" as partitionTable
  ) p
  on p.row_number = 1
  and p.stash = v.stash 
  `;

  result = await sequelize.query(rawQuery);
  //  await models.Validator.findAndCountAll({
  //   include: {
  //     model: models.HistoricalValidatorStatistic,
  //     required: true,
  //     limit: 1,
  //     order: [['created_at', 'DESC']],
  //   }
  // });

  result[0].forEach((stats) => {
    const { exposure = {}, state = '' } = stats;
    if (exposure?.total) {
      totalStaked += parseInt(exposure?.total, 16);
    }
    // count total nominators
    const others = exposure?.others || [];
    others.forEach((obj) => {
      const nominator = obj.who.toString();
      if (!nominators.includes(nominator)) {
        nominators.push(nominator);
      }
    });

    if (state === 'Active') {
      elected++;
    } else if (state === 'Waiting') {
      waiting++;
    }
    // calculate est. apr
    apr += stats?.apr ? stats.apr : 0;
  });
  let lastBlockNumber = 0;
  try {
    lastBlockNumber = result[0][0].block;
  } catch (e) {
    lastBlockNumber = 0;
  }
  return res.json({
    status: 'Success',
    result: {
      elected,
      count: result[0].length,
      waiting,
      nominators: nominators.length,
      totalStaked,
      offences,
      aprPercentage: apr / elected,
      lastBlockNumber
    }
  });
};

export default getGlobalStatistics;
