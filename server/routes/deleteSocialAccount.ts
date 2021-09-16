import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const Errors = {
  NoSocialAccountProvided: 'No Social Account Provider',
}

const log = factory.getLogger(formatFilename(__filename));

const deleteSocialAccount = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  if (!req.body.provider) return next(Errors.NoSocialAccountProvided);
  const socialAccounts = await req.user.getSocialAccounts();
  const socialAccount = socialAccounts.find((sa) => sa.provider === req.body.provider );
  await socialAccount.destroy();
  return res.json({ status: 'Success' });
};

export default deleteSocialAccount;
