import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

const writeUserSetting = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const { key, value } = req.body;

  if (!req.user) {
    return next(new Error('Invalid user'));
  }
  if (!key || !value) {
    return next(new Error('Key and value must be supplied'));
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
  } else {
    return next(new Error('Invalid setting'));
  }

  return res.json({ status: 'Success', result: { key, value } });
};

export default writeUserSetting;
