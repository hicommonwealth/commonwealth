import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

const deleteSocialAccount = async (models: DB, provider: string, req: Request, res: Response, next: NextFunction) => {
  const socialAccounts = await req.user.getSocialAccounts();
  const githubAccount = socialAccounts.find((sa) => sa.provider === provider);
  await githubAccount.destroy();
  return res.json({ status: 'Success' });
};

export default deleteSocialAccount;
