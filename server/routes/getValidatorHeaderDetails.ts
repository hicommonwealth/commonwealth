import { Request, Response, NextFunction } from 'express';
import { Errors } from './getOffences';
import getRewards from './getRewards';
import getSlashes from './getSlashes';
import getOffences from './getOffences';

const getValidatorHeaderDetails = async (models, req: Request, res: Response, next: NextFunction) => {
  const { stash } = req.query;

  if (!stash) return next(new Error(Errors.InvalidStashID));

  const { chain } = req.query;
  if (!chain) return next(new Error(Errors.ChainIdNotFound));

  const chainInfo = await models.Chain.findOne({ where: { id: chain } });
  if (!chainInfo) return next(new Error(Errors.InvalidChain));

  const historicalData = await models.HistoricalValidatorStatistic.findAll({
    limit: 1,
    where: { '$HistoricalValidatorStatistic.stash$': stash },
    order: [['created_at', 'DESC']],
    attributes: ['stash', 'uptime', 'apr', 'rewardsStats', 'slashesStats', 'offencesStats']
  });

  if (historicalData.length === 0) { return next(new Error(Errors.NoRecordsFound)) };

  const dataValues = historicalData[0].dataValues;

  const resp = {};
  resp['apr'] = String(dataValues.apr);
  resp['imOnline'] = String(dataValues.uptime);
  resp['offenceOver30Days'] = Number(dataValues.offenceStats.count);
  resp['SlashesOver30DaysCount'] = Number(dataValues.slashesStats.count);
  resp['SlashesOver30DaysValue'] = String(dataValues.slashesStats.avg);
  resp['RewardsOver30DaysCount'] = Number(dataValues.rewardsStats.count);
  resp['RewardsOver30DaysValue'] = String(dataValues.rewardsStats.avg);


  req.query.version = '38';
  req.query.onlyValue = true;
  const respRewards = await getRewards(models, req, res, next);
  const respSlashes = await getSlashes(models, req, res, next);
  const respOffences = await getOffences(models, req, res, next);

  let sumRewards = 0;
  let sumSlashes = 0;
  //respSlashes.result.forEach(a => sumRewards += a.value);
  //respSlashes.result.forEach(a => sumSlashes += a.value);
  //resp['totalRewardsCount'] = respSlashes.result[stash].length;
  //resp['totalRewardsValue'] = sumRewards;
  //resp['totalSlashesCount'] = respSlashes.result[stash].length;
  //resp['totalSlashesValue'] = sumSlashes;
  //resp['totalOffences'] = respOffences.result[stash].length;



  return res.json({ status: 'Success', result: resp || {} });
};

export default getValidatorHeaderDetails;
