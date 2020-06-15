import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  SignUpError: 'Error signing up a user',
};

export default async (models, req: Request, res: Response, next: NextFunction) => {
  const body = req.body;
  if (body && body.iv && body.cipherText && body.lookupKey) {
    try {
      const authObj = await models.HedgehogAuthentication.create({
        iv: body.iv,
        cipherText: body.cipherText,
        lookupKey: body.lookupKey
      });
      return res.json({ status: 'Success', result: authObj.toJSON() });
    } catch (err) {
      log.error('Error signing up a user', err);
      return next(new Error(Errors.SignUpError));
    }
  } else return next(new Error('Missing one of the required fields: iv, cipherText, lookupKey'));
};
