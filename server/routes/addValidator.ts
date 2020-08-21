import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
    alreadyPresent: 'Validator already exist',
    message: 'Validator Insertion failed :   ',
};

const addValidator = async (models, req: Request, res: Response, next: NextFunction) => {
    let { stash = '', controller = '', lastUpdate = 0, state = '', sessionKeys = [] } = req.body;
    if (stash && stash.trim() && controller && controller.trim()) {
        try {
            const validator = await models.Validator.findOne({
                where: {
                    stash,
                },
            });

            if (validator)
                return next(new Error(Errors.alreadyPresent));

            const added_validator = await models.Validator.create({
                stash,
                controller,
                sessionKeys,
                state,
                lastUpdate
            });
            return res.json({ status: 'Success', result: added_validator.toJSON() });
        } catch (err) {
            log.error('Error  ', err);
            return next(new Error(Errors.message + err));
        }
    } else return next(new Error('Stash ID and COntroller ID are required'));
};
export default addValidator;