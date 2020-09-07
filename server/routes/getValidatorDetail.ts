/* eslint-disable guard-for-in */
import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';


const getCurrentValidators = async (models, req: Request, res: Response, next: NextFunction) => {
    let validators: any = [];
    let where: any = req.params && req.params.state ? { state: req.params.state } : { state: 'Active' };
    
    if (req.body && req.body.validatorStashes){
        where.stash_id = { [Op.in]: req.body.validatorStashes };
    }

    validators = await models.Validators.findAll({
        where: where,
        include: {
            model: models.HistoricalValidatorStats,
            order: [['createdAt', 'DESC']],
        }
    });

    validators = JSON.parse(JSON.stringify(validators));
    validators.map(row => {
        row.HistoricalValidatorStats = row.HistoricalValidatorStats && row.HistoricalValidatorStats.length > 0 ? [row.HistoricalValidatorStats[0]]: [];
    });

    return res.json({
        status: 'Success',
        count: validators.length,
        result: {
            validators
        }
    });
};


export default getCurrentValidators;
