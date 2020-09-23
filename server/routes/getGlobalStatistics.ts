import { Request, Response, NextFunction } from 'express';

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

  let { chain, stash } = req.query;
  chain = 'edgeware-local';
  if (!chain) return next(new Error(Errors.ChainIdNotFound));

  const chainInfo = await models.Chain.findOne({
    where: { id: chain }
  });

  let where: any = {
    chain_event_type_id: `${chain}-offences-offence`
  };

  const offences = await models.ChainEvent.count({
    where
  });

  result = await models.Validator.findAndCountAll({
    include: {
      model: models.HistoricalValidatorStatistic,
      required: true,
      limit: 1,
      order: [['created_at', 'DESC']],
    }
  });

  result.rows.forEach((stats) => {
    stats.exposure = stats.HistoricalValidatorStatistics[0]?.exposure;
    stats.apr = stats.HistoricalValidatorStatistics[0]?.apr;
    const { exposure = {}, state = '' } = stats;
    if (exposure.total) {
      totalStaked += parseInt(exposure.total, 16);
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
    } else {
      waiting++;
    }
    // calculate est. apr
    apr += stats?.apr ? stats.apr : 0;
  });

  return res.json({
    status: 'Success',
    result: {
      elected: elected,
      count: result.rows.length,
      waiting: waiting,
      nominators: nominators.length,
      totalStaked: totalStaked,
      offences: offences,
      aprPercentage: apr / elected
    }
  });
};

export default getGlobalStatistics;
