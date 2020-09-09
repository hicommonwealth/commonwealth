/* eslint-disable guard-for-in */
import { Request, Response, NextFunction } from 'express';

const getGlobalStatistics = async (models, req: Request, res: Response, next: NextFunction) => {

    let result: any = [];
    result = await models.Validators.findAndCountAll({
        include: {
            model: models.HistoricalValidatorStatistics,
            required: true,
            limit: 1,
            order: [['created_at', 'DESC']],
        }
    });
    return res.json({
        status: 'Success',
        result
    });
};

export default getGlobalStatistics;
