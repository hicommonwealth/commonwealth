import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
};

const deleteGithubAccount = async (models, req: Request, res: Response, next: NextFunction) => {
  const socialAccounts = await req.user.getSocialAccounts();
  const githubAccount = socialAccounts.find((sa) => sa.provider === 'github');
  await githubAccount.destroy();
  return res.json({ status: 'Success' });
};

export default deleteGithubAccount;
