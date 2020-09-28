import { Request, Response, NextFunction } from 'express';
import { getOffencesFunc, Errors } from './getOffences';
import { getRewardsFunc } from './getRewards';
import { getSlashesFunc } from './getSlashes';


// helper function
function sum(obj) {
  return Object.keys(obj).reduce((s, key) => s + Number(obj[key]) || 0, 0);
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
  const respRewards = await getRewardsFunc(models, req, next);
  const respSlashes = await getSlashesFunc(models, req, next);
  const respOffences = await getOffencesFunc(models, req, next);

  const resp = {};
  resp['apr'] = String(dataValues.apr);
  resp['imOnline'] = String(dataValues.uptime);
  resp['offenceOver30Days'] = 'offencesStats' in dataValues ? Number(dataValues.offencesStats.count) : 0;
  resp['slashesOver30DaysCount'] = 'slashesStats' in dataValues ? Number(dataValues.slashesStats.count) : 0;
  resp['slashesOver30DaysValue'] = 'slashesStats' in dataValues ? String(dataValues.slashesStats.sum) : '0';
  resp['rewardsOver30DaysCount'] = 'rewardsStats' in dataValues ? Number(dataValues.rewardsStats.count) : 0;
  resp['rewardsOver30DaysValue'] = 'rewardsStats' in dataValues ? String(dataValues.rewardsStats.sum) : '0';
  resp['totalSlashesValue'] = stash in respSlashes['result'] ? sum(respSlashes['result'][stash]) : '0';
  resp['totalSlashesCount'] = stash in respSlashes['result'] ? Object.keys(respSlashes['result'][stash]).length : 0;
  resp['totalRewardsValue'] = stash in respRewards['result'] ? sum(respRewards['result'][stash]) : '0';
  resp['totalRewardsCount'] = stash in respRewards['result'] ? Object.keys(respRewards['result'][stash]).length : 0;
  resp['totalOffences'] = stash in respOffences['result'] ? Object.keys(respOffences['result'][stash]).length : 0;

  return res.json({ status: 'Success', result: resp || {} });
};

export default getValidatorHeaderDetails;
