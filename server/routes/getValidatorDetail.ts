/* eslint-disable guard-for-in */
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { Op } from 'sequelize';
const log = factory.getLogger(formatFilename(__filename));


function flatten(validators) {
    validators = JSON.parse(JSON.stringify(validators));
    const filteredValidators = validators.rows.map((row) => {
        let dataObject = { ...row, ...row.Validator };
        delete dataObject.Validator;
        return dataObject;
    });
    return filteredValidators;
}

function formatData(searchCriteria) {
    for (let key in searchCriteria) {
        if (key === 'name' || key === 'stash_id') {
            let temp = { ...searchCriteria };
            delete searchCriteria[key];
            searchCriteria = {
                ...searchCriteria,
                [key]: {

                    [Op.iLike]: `%${temp[key]}%`
                }
            }
        }
    }
    return searchCriteria;
}
export const getCurrentValidators = async (models, req: Request, res: Response, next: NextFunction) => {
    let { pagination = { currentPageNo: 1, pageSize: 20 }, searchCriteria } = req.query;
    searchCriteria = formatData(searchCriteria);
    try {
        let currentValidators = await models.HistoricalValidatorStats.findAndCountAll({
            include: {
                model: models.Validators
            },
            where: { ...searchCriteria, isElected: true,/*isLatest: true*/ },
            offset: pagination?.pageSize * (pagination?.currentPageNo - 1),
            limit: pagination?.pageSize,
            order: [
                ['stash_id', 'ASC']
            ]
        });

        if (!currentValidators) {
            return next(new Error('getCurrentValidator not found'));
        }
        log.info("CurrentValidators fetched successfully");
        console.log(flatten(currentValidators), "flatten(currentValidators)")
        return res.json({
            status: 'Success',
            result: {
                currentValidators: flatten(currentValidators),
                pagination: {
                    ...pagination,
                    totalRecords: currentValidators.count
                }
            }
        });

    }
    catch (e) {
        log.info("Error Occurred while fetching validator details : ", e.stack);
        return {
            status: 'Error',
            message: e,
            stack: e.stack
        };
    }

};
export const getWaitingValidators = async (models, req: Request, res: Response, next: NextFunction) => {
    let { pagination = { currentPageNo: 1, pageSize: 20 }, searchCriteria } = req.query;
    searchCriteria = formatData(searchCriteria);
    try {
        let waitingValidators = await models.HistoricalValidatorStats.findAndCountAll({
            include: {
                model: models.Validators
            },
            where: { ...searchCriteria, isElected: false,/*isLatest: true*/ },
            offset: pagination?.pageSize * (pagination?.currentPageNo - 1),
            limit: pagination?.pageSize,
            order: [
                ['stash_id', 'ASC']
            ]
        });

        if (!waitingValidators) {
            return next(new Error('ValidagetCurrentValidator not found'));
        }
        log.info("WaitingValidators fetched successfully");
        return res.json({
            status: 'Success',
            result: {
                waitingValidators: flatten(waitingValidators),
                pagination: {
                    ...pagination,
                    totalRecords: waitingValidators.count
                }
            }
        });
    }
    catch (e) {
        log.info("Error Occurred while fetching validator details : ", e.stack);
        return {
            status: 'Error',
            message: e,
            stack: e.stack
        };
    }

};

