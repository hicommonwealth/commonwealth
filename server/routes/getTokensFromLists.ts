import { Request, Response, NextFunction } from 'express';
import { AppError, ServerError } from '../util/errors';
import { DB } from '../database';

export const getTokensFromLists = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tokens = await models.Token.findAll();
    const chains = await models.Chain.findAll();
    const chainNames = chains.map((chain) => chain.name.toLowerCase());
    const filteredTokens = tokens.filter(
      (token) => !chainNames.includes(token.name.toLowerCase())
    );
    return res.json({ status: 'Success', result: filteredTokens });
  } catch (e) {
    throw new ServerError('Database error getting tokens and chains', e);
  }
};
