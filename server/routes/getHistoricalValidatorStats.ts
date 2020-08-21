/* eslint-disable guard-for-in */
import { Request, Response, NextFunction } from 'express';


// create foriegn key reference
// get latest stats of each validator

const getHistoricalValidatorStats = async (models, req: Request, res: Response, next: NextFunction) => {

    const hist_val_stats = await models.HistoricalValidatorStats.findAll({
        where: {
            // state: "Active"
        }
    });
    return res.json({
        status: 'Success',
        result: {
            hist_val_stats
        }
    });
};

export default getHistoricalValidatorStats;
