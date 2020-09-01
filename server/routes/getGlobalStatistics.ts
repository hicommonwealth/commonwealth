/* eslint-disable guard-for-in */
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';


const getGlobalStatistics = async (models, req: Request, res: Response, next: NextFunction) => {
    let result: any = [];
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
