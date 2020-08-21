/* eslint-disable guard-for-in */
import { Request, Response, NextFunction } from 'express';


// in real we will store validators acc to currentSessionIndex
// and will fetch with currentIndex in where clause
const getValidators = async (models, req: Request, res: Response, next: NextFunction) => {

    const validators = await models.Validator.findAll({
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
