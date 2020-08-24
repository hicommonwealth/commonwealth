/* eslint-disable guard-for-in */
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));


const getGlobalStatistics = async (models, req: Request, res: Response, next: NextFunction) => {


    try {
        let stats = await models.HistoricalValidatorStats.findAndCountAll({
            include: {
                model: models.Validators
            },
            where: {
                // isLatest: true
            }
        });
        console.log(stats, "stats ===========================================")
        if (!stats) {
            return next(new Error('No stats found'));
        }
        if (stats) {
            log.info("Global statistics fetched successfully");
            return res.json({
                status: 'Success',
                stats
            });
        }

    }
    catch (e) {
        log.info("Error Occurred while fetching global statistics : \n" + e);
        log.info("Error stack : " + e.stack);
        return res.json({
            status: 'Error',
            message: e,
            stack: e.stack
        });
    }

};

export default getGlobalStatistics;
