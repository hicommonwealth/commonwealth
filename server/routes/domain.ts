import { Request, Response, NextFunction } from 'express';
import { DB } from '../database';

const domain = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const hostname = req.headers['x-forwarded-host'] || req.hostname;

  // return the community id matching the hostname's custom domain
  try {
    const [chain, community] = await Promise.all([
      models.Chain.findOne({ where: { custom_domain: hostname } }),
      models.OffchainCommunity.findOne({ where: { custom_domain: hostname } }),
    ]);
    if (chain || community) {
      return res.json({ customDomain: chain ? chain.id : community.id });
    }
  } catch (e) {}

  // otherwise, return false
  return res.json({ customDomain: null });
};

export default domain;
