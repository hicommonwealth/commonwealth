import { Request, Response, NextFunction } from 'express';
import { getOffencesFunc, Errors } from './getOffences';
import { getRewardsFunc } from './getRewards';
import { getSlashesFunc } from './getSlashes';
const axios = require('axios').default;


// helper function
function sum(obj) {
  return Object.keys(obj).reduce((s, key) => s + parseFloat(obj[key] || 0), 0);
}

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

  if (historicalData.length === 0) { return next(new Error(Errors.NoRecordsFound)); }

  const dataValues = historicalData[0].dataValues;
  req.query.version = '38';
  req.query.onlyValue = true;
  const respRewards = await getSlashesFunc(models, req, next);
  const respSlashes = await getSlashesFunc(models, req, next);
  const respOffences = await getSlashesFunc(models, req, next);

  const resp = {};
  resp['apr'] = String(dataValues.apr);
  resp['imOnline'] = String(dataValues.uptime);
  resp['offenceOver30Days'] = 'offenceStats' in dataValues ? Number(dataValues.offenceStats.count) : 0;
  resp['SlashesOver30DaysCount'] = 'slashesStats' in dataValues ? Number(dataValues.slashesStats.count) : 0;
  resp['SlashesOver30DaysValue'] = 'slashesStats' in dataValues ? String(dataValues.slashesStats.avg) : '0';
  resp['RewardsOver30DaysCount'] = 'rewardsStats' in dataValues ? Number(dataValues.rewardsStats.count) : 0;
  resp['RewardsOver30DaysValue'] = 'rewardsStats' in dataValues ? String(dataValues.rewardsStats.avg) : '0';
  resp['totalSlashesValue'] = sum(respSlashes['result'][stash]);
  resp['totalSlashesCount'] = respSlashes['result'][stash].length;
  resp['totalRewardsValue'] = sum(respRewards['result'][stash]);
  resp['totalRewardsCount'] = respRewards['result'][stash].length;
  resp['totalOffences'] = respOffences['result'][stash].length;


  return res.json({ status: 'Success', result: resp || {} });
};

export default getValidatorHeaderDetails;
