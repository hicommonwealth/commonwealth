'use strict';
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
    InvalidStashID: 'Validator not found',
    message: 'Validator Updation failed :   '
};

const updateValidator = async (models, req: Request, res: Response, next: NextFunction) => {
    let { stash = '', controller = '', lastUpdate = 0, state = '', sessionKeys = [] } = req.body;

    if (stash && stash.trim()) {
        try {
            const validator = await models.Validators.findOne({
                where: {
                    stash,
                },
            });

            if (!validator) return next(new Error(Errors.InvalidStashID));

            validator.controller = controller ? controller : validator.controller;
            validator.state = state ? state : validator.state;
            validator.lastUpdate = lastUpdate ? lastUpdate : validator.lastUpdate;

            if (sessionKeys && sessionKeys.length) {
                validator.sessionKeys = [...new Set([...validator.sessionKeys, ...sessionKeys])];
            }
            await validator.save();
            return res.json({ status: 'Success', result: validator.toJSON() });
        } catch (err) {
            log.error('Error  ', err);
            return next(new Error(Errors.message + err));
        }
    } else return next(new Error('Stash ID is required'));

};

export default updateValidator;
