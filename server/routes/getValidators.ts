/* eslint-disable guard-for-in */
import { Request, Response, NextFunction } from 'express';


const getValidators = async (models, req: Request, res: Response, next: NextFunction) => {

    let validators = await models.Validators.findAll({
        where: {
            // state: "Active"
        }
    });
    return res.json({
        status: 'Success',
        result: {
            validators
        }
    });
};

export default getValidators;
