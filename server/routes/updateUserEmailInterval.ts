import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoInterval: 'Must provide notification email interval',
  NoEmail: 'Must have email connected to user',
  NoUser: 'Could not find a user model',
  InvalidInterval: 'Invalid Interval',
};

const updateUserEmailInterval = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.body.interval) return next(new Error(Errors.NoInterval));
  const { email, interval } = req.body;

  const intervals = ['daily', 'weekly', 'monthly', 'never'];
  if (!intervals.includes(interval)) return next(new Error(Errors.InvalidInterval));

  const user = await models.User.findOne({
    where: {
      id: req.user.id,
    }
  });
  if (!user) return next(new Error(Errors.NoUser));
  if (!user.email) return next(new Error(Errors.NoEmail));

  user.emailNotificationInterval = interval;
  await user.save();

  return res.json({ status: 'Success', result: user.toJSON() });
};

export default updateUserEmailInterval;
