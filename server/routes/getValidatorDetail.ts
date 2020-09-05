/* eslint-disable guard-for-in */
import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';

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
    let currentValidators: any = [];
    // fetch recently updated records i.e where isLatest = true
    let { pagination = { currentPageNo: 1, pageSize: 20 }, searchCriteria } = req.query;
    searchCriteria = formatData(searchCriteria);
    currentValidators = await models.HistoricalValidatorStats.findAndCountAll({
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
    return res.json({
        status: 'Success',
        result: {
            currentValidators: flatten(currentValidators),
            pagination: {
                ...pagination,
                totalRecords: currentValidators?.count || 0
            }
        }
    });
};
export const getWaitingValidators = async (models, req: Request, res: Response, next: NextFunction) => {
    let waitingValidators: any = [];
    let { pagination = { currentPageNo: 1, pageSize: 20 }, searchCriteria } = req.query;
    searchCriteria = formatData(searchCriteria);

    // fetch recently updated records i.e where isLatest = true
    waitingValidators = await models.HistoricalValidatorStats.findAndCountAll({
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
    return res.json({
        status: 'Success',
        result: {
            waitingValidators: flatten(waitingValidators),
            pagination: {
                ...pagination,
                totalRecords: waitingValidators?.count || 0
            }
        }
    });
};

