/* eslint-disable guard-for-in */
import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';

function whereClause(searchCriteria, where) {
    let { validatorStashes = undefined, value = undefined } = searchCriteria;
    if (validatorStashes && validatorStashes instanceof Array) {
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
    let where: any = { state: 'active' };
    // fetch recently updated records i.e where isLatest = true
    let { pagination = { currentPageNo: 1, pageSize: 20 }, searchCriteria } = req.body;

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
            currentValidators,
            pagination: {
                ...pagination,
                totalRecords: currentValidators?.count || 0
            }
        }
    });
};






export const getWaitingValidators = async (models, req: Request, res: Response, next: NextFunction) => {
    let waititngValidator: any = [];
    let where: any = { state: 'waiting' };
    // fetch recently updated records i.e where isLatest = true
    let { pagination = { currentPageNo: 1, pageSize: 20 }, searchCriteria } = req.body;

    console.log("-where: ", where);
    waititngValidator = await models.Validators.findAndCountAll({
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
            waititngValidator,
            pagination: {
                ...pagination,
                totalRecords: waititngValidator?.count || 0
            }
        }
    });
};

