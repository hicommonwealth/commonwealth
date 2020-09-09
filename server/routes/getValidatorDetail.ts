/* eslint-disable guard-for-in */
import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';


const getValidatorDetail = async (models, req: Request, res: Response, next: NextFunction) => {
    // console.log("reqqqqqqq ", req.params)
    console.log("body ", req.query.validatorStashes);

    let validators: any = [];
    let where: any = { state: req.query?.state ? req.query?.state : 'Active' };

    //serarch by name or address
    if (req.query?.validatorStashes?.length) {
        // where.stash_id = { [Op.in]: req?.query?.validatorStashes };
        where = {
            [Op.or]: [
                {
                    stash_id:
                        { [Op.in]: req?.query?.validatorStashes }
                },
                {
                    name:
                        { [Op.in]: req?.query?.validatorStashes }
                }
            ],
            ...where
        }
    }
    console.log("where ======== ", where)
    validators = await models.Validators.findAll({
        where: where,
        include: {
            model: models.HistoricalValidatorStatistics,
            order: [['created_at', 'DESC']],
        }
    });

    validators = JSON.parse(JSON.stringify(validators));
    validators = validators.map(row => {
        row = { ...row.HistoricalValidatorStatistics?.[0], ...row };
        delete row.HistoricalValidatorStatistics;
        return row;
    });

    return res.json({
        status: 'Success',
        count: validators.length,
        result: {
            validators
        }
    });
};

export default getValidatorDetail;
