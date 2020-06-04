import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoEmail: 'Must provide email to update.',
  NoUser: 'Could not find user',
  InvalidEmail: 'Invalid Email',
};

const updateEmail = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.body.email) return next(new Error(Errors.NoEmail));
  const { email } = req.body;

  // validate the email
  const validEmailRegex = /\S+@\S+\.\S+/;
  if (!validEmailRegex.test(email)) {
    return next(new Error(Errors.InvalidEmail));
  }

  const user = await models.User.findOne({
    where: {
      id: req.user.id,
    }
  });
  if (!user) return next(new Error(Errors.NoUser));

  user.email = email;
  await user.save();

  return res.json({ status: 'Success', result: user.toJSON() });
};

export default updateEmail;
