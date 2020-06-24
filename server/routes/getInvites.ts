import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoUser: 'Cannot find associated user',
  NoEmail: 'No email for associated user',
};

const getInvites = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  const { user } = req;

  if (!user) return next(new Error(Errors.NoUser));
  if (!user.email) return next(new Error(Errors.NoEmail));

  const invites = await models.InviteCode.findAll({
    where: {
      invited_email: user.email,
      used: false,
    }
  });

  if (!invites) return res.json({ status: 'Failure' }); // No Invites

  return res.json({ status: 'Success', result: invites });
};

export default getInvites;
