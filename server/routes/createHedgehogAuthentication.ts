import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

export default async (models, req: UserRequest, res: Response, next: NextFunction) => {
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
      console.error('Error signing up a user', err);
      return next(new Error('Error signing up a user'));
    }
  } else return next(new Error('Missing one of the required fields: iv, cipherText, lookupKey'));
};
