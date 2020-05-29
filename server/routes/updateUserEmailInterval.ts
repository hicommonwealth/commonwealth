import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

const Errors = {
  NotLoggedIn: 'Not logged in',
  NoInterval: 'Must provide notification email interval',
  NoEmail: 'Must have email connected to user',
  NoUser: 'Could not find a user model',
  InvalidInterval: 'Invalid Interval',
};

const updateUserEmailInterval = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body.interval) return next(new Error(Errors.NoInterval));
  const { email, interval } = req.body;

  const user = await models.User.findOne({
    where: {
      id: req.user.id,
    }
  });
  if (!user) return next(new Error(Errors.NoUser));

  const intervals = ['daily', 'weekly', 'monthly', 'never'];
  if (!intervals.includes(interval)) return next(new Error(Errors.InvalidInterval));
  user.emailNotificationInterval = interval;
  await user.save();

  return res.json({ status: 'Success', result: user.toJSON() });
};

export default updateUserEmailInterval;
