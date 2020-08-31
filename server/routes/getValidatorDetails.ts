/* eslint-disable guard-for-in */
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));




const getValidatorDetails = async (models, req: Request, res: Response, next: NextFunction) => {
    let currentValidator = [];
    let waitingValidator = [];
    const pagination = {
        pageSize: 10,
        currentPageNo: 1,
        ...req.body.pagination
    };
    try {
        let stats = await models.HistoricalValidatorStats.findAndCountAll({
            include: {
                model: models.Validators
            },
            where: { ...req.body.searchCriteria, /*isLatest: true*/ },
            offset: pagination?.pageSize * (pagination?.currentPageNo - 1),
            limit: pagination?.pageSize
        });

        if (!stats) {
            return next(new Error('Validator details not found'));
        }

        stats = JSON.parse(JSON.stringify(stats));

        //flattening Validator model
        const allValidators = stats.rows.map((row) => {
            let dataObject = { ...row, ...row.Validator };
            delete dataObject.Validator;
            if (row.isElected) {
                currentValidator.push(row);
            } else {
                waitingValidator.push(row);
            }
            return dataObject;
        });

        log.info("Validator details fetched successfully");
        return res.json({
            status: 'Success',
            result: {
                // allValidators,
                currentValidator,
                // waitingValidator,
                pagination: {
                    ...pagination,
                    totalRecords: stats.count,
                    countCurrentValidator: currentValidator.length,
                    countWaitingValidator: waitingValidator.length
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
