/* eslint-disable guard-for-in */
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { Op } from 'sequelize';
const log = factory.getLogger(formatFilename(__filename));

// let pagination = {
//     pageSize: 10,
//     currentPageNo: 1
// };
function flatten(validators) {
    validators = JSON.parse(JSON.stringify(validators));
    const filteredValidators = validators.rows.map((row) => {
        let dataObject = { ...row, ...row.Validator };
        delete dataObject.Validator;
        return dataObject;
    });
    return filteredValidators;
}

export const getCurrentValidators = async (models, req: Request, res: Response, next: NextFunction) => {
    console.log("reqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq", req.query);
    let { pagination = { currentPageNo: 1, pageSize: 20 }, searchCriteria } = req.query;


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
    console.log("\n\n +++++++++++++++++++++++++++ \n searchCriteria \n", searchCriteria)
    // pagination = { ...pagination, ...req.query.pagination };
    try {
        let currentValidators = await models.HistoricalValidatorStats.findAndCountAll({
            include: {
                model: models.Validators
            },
            // [Op.like]: '%' + request.body.query + '%'
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
        log.info("getCurrentValidators fetched successfully");
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
        log.info("Error Occurred while fetching validator details : \n", e);
        log.info("Error stack : ", e.stack);
        return {
            status: 'Error',
            message: e,
            stack: e.stack
        };
    }

};
export const getWaitingValidators = async (models, req: Request, res: Response, next: NextFunction) => {
    // console.log("reqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq", req.query.pagination);
    let { pagination = { currentPageNo: 1, pageSize: 20 }, searchCriteria } = req.query;
    // console.log("\n\n +++++++++++++++++++++++++++ \n searchCriteria \n", searchCriteria)
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
    console.log("\n\n +++++++++++++++++++++++++++ \n searchCriteria \n", searchCriteria)
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
        log.info("get waitingValidators fetched successfully");

        // console.log("flatten(waitingValidators) ", flatten(waitingValidators));
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
        log.info("Error Occurred while fetching validator details : \n", e);
        log.info("Error stack : ", e.stack);
        return {
            status: 'Error',
            message: e,
            stack: e.stack
        };
    }

};

// export const getValidatorDetails = (models, req: Request, res: Response, next: NextFunction) => {
//     let sc = req.body?.searchCriteria;
//     delete sc?.isElected;
//     req.body.searchCriteria = sc;
//     let validatorsDetails = {
//         CurrentValodators: getCurrentValidators(models, req, res, next),
//         WaitingValidators: getWaitingValidators(models, req, res, next),
//     }
//     return validatorsDetails;
// }

