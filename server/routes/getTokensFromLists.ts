
import { Request, Response, NextFunction } from 'express';
import TokenBalanceCache from '../util/tokenBalanceCache';
import { DB } from '../database';

export const getTokensFromLists = async (
  models: DB,
  tokenBalanceCache: TokenBalanceCache,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tokens = await tokenBalanceCache.getTokens();
    const chains = await models.Chain.findAll();
    const chainNames = chains.map((chain) => chain.name.toLowerCase());
    const filteredTokens = tokens.filter((token) => !chainNames.includes(token.name.toLowerCase()));
    return res.json({ status: 'Success', result: filteredTokens });
  } catch (e) {
    return res.json({ status: 'Failure', message: e.message });
  }
};
