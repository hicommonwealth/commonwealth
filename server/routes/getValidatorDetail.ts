/* eslint-disable guard-for-in */
import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';


function flatten(validators) {
    validators = JSON.parse(JSON.stringify(validators));
    const filteredValidators = validators.rows.map((row) => {
        let dataObject = { ...row, ...row.HistoricalValidatorStats[0] };
        delete dataObject.HistoricalValidatorStats;
        return dataObject;
    });
    return filteredValidators;
}

function whereClause(searchCriteria, where) {
    console.log("searchCriteria ========== ", searchCriteria)
    let { validatorStashes = undefined, value = undefined } = searchCriteria;
    console.log("vssssssssssss ", validatorStashes)
    if (validatorStashes && validatorStashes.length) {
        console.log("vssssssssssss ", validatorStashes)
        where = {
            stash_id: {
                [Op.in]: validatorStashes
            },
            ...where
        }
    }
    if (value && value.trim()) {
        where = {
            [Op.or]: [
                {
                    stash_id:
                        { [Op.iLike]: `%${value}%` }
                },
                {
                    name:
                        { [Op.iLike]: `%${value}%` }
                }
            ],
            ...where
        }
    }

    return where;
}
export const getCurrentValidators = async (models, req: Request, res: Response, next: NextFunction) => {
    let currentValidators: any = [];
    let where: any = { state: 'Active' };

    let { pagination = { currentPageNo: 1, pageSize: 7 }, searchCriteria = {} } = req.query;

    console.log("-where: ", where);
    currentValidators = await models.Validators.findAndCountAll({
        include: {
            model: models.HistoricalValidatorStats,
            required: true,
            limit: 1,
            order: [['createdAt', 'DESC']],
        },
        where: whereClause(searchCriteria, where),
        offset: pagination?.pageSize * (pagination?.currentPageNo - 1),
        limit: pagination?.pageSize,
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
    let where: any = { state: 'Waiting' };
    let { pagination = { currentPageNo: 1, pageSize: 7 }, searchCriteria = {} } = req.query;

    console.log("-where: ", where);
    waitingValidators = await models.Validators.findAndCountAll({
        include: {
            model: models.HistoricalValidatorStats,
            required: true,
            limit: 1,
            order: [['createdAt', 'DESC']],
        },
        where: whereClause(searchCriteria, where),
        offset: pagination?.pageSize * (pagination?.currentPageNo - 1),
        limit: pagination?.pageSize,
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

