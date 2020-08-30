/* eslint-disable guard-for-in */
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));


const getValidatorDetails = async (models, req: Request, res: Response, next: NextFunction) => {

    let searchCriteria = req.body.searchCriteria || { /*isLatest: true*/ };

    searchCriteria = searchCriteria && (searchCriteria.address || searchCriteria.name) ? {
        stash_id: searchCriteria.address
        // isLatest: true
    } : {};

    let pagination = req.body.pagination || {
        pageSize: 10,
        currentPageNo: 1
    };
    try {
        let stats = await models.HistoricalValidatorStats.findAndCountAll({
            include: {
                model: models.Validators
            },
            where: searchCriteria,
            offset: pagination?.pageSize * (pagination?.currentPageNo - 1),
            limit: pagination?.pageSize
        })

        if (!stats) {
            return next(new Error('Validator details not found'));
        }

        log.info("Validator details fetched successfully");
        return res.json({
            status: 'Success',
            result: {
                data: stats.rows,
                pagination: {
                    ...pagination, totalRecords: stats.count
                }
            }
        });

    }
    catch (e) {
        log.info("Error Occurred while fetching validator details : \n", e);
        log.info("Error stack : ", e.stack);
        return res.json({
            status: 'Error',
            message: e,
            stack: e.stack
        });
    }

};

export default getValidatorDetails;
