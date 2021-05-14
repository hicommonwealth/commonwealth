
import { Request, Response, NextFunction } from 'express';
import TokenBalanceCache from '../util/tokenBalanceCache';

export const getTokensFromLists = async (
  models,
  tokenBalanceCache: TokenBalanceCache,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tokens = await tokenBalanceCache.getTokens();
    return res.json({ status: 'Success', result: tokens });
  } catch (e) {
    return res.json({ status: 'Failure', message: e.message });
  }
};
