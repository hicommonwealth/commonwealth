import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  message: 'Stats Insertion failed :   ',
};

const upsertHistoricalValidatorStatistic = async (models, req: Request, res: Response, next: NextFunction) => {
  const { stash = '', block = '', commission = '', exposure = [], apr = '', uptime = '', movingAverages = '' } = req.body;
  if (stash && stash.trim()) {
    try {
      const stats_added = await models.HistoricalValidatorStatistic.create({
        ...req.body
      });
      return res.json({ status: 'Success', result: stats_added.toJSON() });
    } catch (err) {
      log.error('Error  ', err);
      return next(new Error(Errors.message + err));
    }
  } else return next(new Error('Stash ID is required'));
};
export default upsertHistoricalValidatorStatistic;
