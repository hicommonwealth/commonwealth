import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

const VALID_DIGEST_INTERVALS = ['daily', 'never'];

export const Errors = {
  InvalidUser: 'Invalid user',
  NoKeyValue: 'Must provide key and value',
  InvalidSetting: 'Invalid setting',
};

const writeUserSetting = async (models, req: Request, res: Response, next: NextFunction) => {
  const { key, value } = req.body;

  if (!req.user) {
    return next(new Error(Errors.InvalidUser));
  }
  if (!key || !value) {
    return next(new Error(Errors.NoKeyValue));
  }

  if (key === 'lastVisited') {
    const obj = JSON.parse(req.user.lastVisited);
    const val = JSON.parse(value);
    const { activeEntity, timestamp } = val;
    obj[activeEntity] = timestamp;
    const str = JSON.stringify(obj);
    req.user.lastVisited = str;
    await req.user.save();
  } else if (key === 'disableRichText' && value === 'true') {
    req.user.disableRichText = true;
    await req.user.save();
  } else if (key === 'disableRichText' && value === 'false') {
    req.user.disableRichText = false;
    await req.user.save();
  } else if (key === 'updateEmailInterval' && VALID_DIGEST_INTERVALS.indexOf(value) !== -1) {
    req.user.emailNotificationInterval = value;
    await req.user.save();
  } else {
    return next(new Error(Errors.InvalidSetting));
  }

  return res.json({ status: 'Success', result: { key, value } });
};

export default writeUserSetting;
