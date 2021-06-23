import { Request, Response, NextFunction } from 'express';
import TokenListCache from '../util/tokenListCache';

const addDecimalsToTokens = async (models, req: Request, res: Response, next: NextFunction) => {
  const tlc = new TokenListCache();
  const tokens = await tlc.getTokens();

  const chains = await models.Chain.findAll();
  try {
    let rowsChanged = 0;
    await Promise.all(chains.map(async (chain) => {
      if (chain.type === 'token'
      && (chain.decimals === undefined || chain.decimals === null)) {
        const token = tokens.find((o) => o.name === chain.name && o.symbol === chain.symbol);
        if (token) {
          chain.decimals = token.decimals;
          await chain.save();
          rowsChanged++;
        }
      }
    }));
    return res.json({ status: 'Success', result: { rowsChanged } });
  } catch (e) {
    return next(e);
  }
};

export default addDecimalsToTokens;
