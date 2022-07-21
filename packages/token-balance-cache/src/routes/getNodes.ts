import { Request, Response } from 'express';
import TokenBalanceCache from "../cache";
import { validateSecret } from './util';

const getNodes = async (
  cache: TokenBalanceCache,
  req: Request,
  res: Response
) => {
  if (!validateSecret(req.body.secret)) {
    return res.status(401).json('Not authorized');
  }

  const nodes = cache.nodes;
  if (!nodes) {
    return res.status(500).json('Server error');
  }
  return res.status(200).json(nodes);
};

export default getNodes;