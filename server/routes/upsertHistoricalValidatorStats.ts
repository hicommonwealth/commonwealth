import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
    message: 'Stats Insertion failed :   ',
};

const upsertHistoricalValidatorStats = async (models, req: Request, res: Response, next: NextFunction) => {
    let { stash_id = '' } = req.body;
    console.log(req.body);

    if (stash_id && stash_id.trim()) {
        try {
            const stats_added = await models.HistoricalValidatorStats.create({

                ...req.body
            });
            return res.json({ status: 'Success', result: stats_added.toJSON() });
        } catch (err) {
            log.error('Error  ', err);
            return next(new Error(Errors.message + err));
        }
    } else return next(new Error('Stash ID is required'));
};
export default upsertHistoricalValidatorStats;