/* eslint-disable guard-for-in */
import { Request, Response, NextFunction } from 'express';


const getGlobalStatistics = async (models, req: Request, res: Response, next: NextFunction) => {
    let result: any = [];

    // fetch recently updated records i.e where isLatest = true
    result = await models.HistoricalValidatorStats.findAndCountAll({
        // where: {
        //     // isLatest: true
        // }
    });
    return res.json({
        status: 'Success',
        result
    });
};

export default getGlobalStatistics;
