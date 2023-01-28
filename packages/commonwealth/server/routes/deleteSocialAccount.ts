import type { Request, Response } from 'express';
import type { DB } from '../models';

const deleteSocialAccount = async (
  models: DB,
  provider: string,
  req: Request,
  res: Response
) => {
  const socialAccounts = await req.user.getSocialAccounts();
  const githubAccount = socialAccounts.find((sa) => sa.provider === provider);
  await githubAccount.destroy();
  return res.json({ status: 'Success' });
};

export default deleteSocialAccount;
