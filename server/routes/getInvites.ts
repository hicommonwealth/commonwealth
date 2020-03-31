import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

const getInvites = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error('Not Logged In'));
  const { user } = req;

  if (!user) return next(new Error('Cannot find associated User'));
  if (!user.email) return next(new Error('No email included for User, cannot query Invites'));

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
