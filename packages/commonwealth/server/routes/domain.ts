import { Request, Response, NextFunction } from 'express';
import { DB } from '../models';

const domain = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const hostname = req.headers['x-forwarded-host'] || req.hostname;

  // return the community id matching the hostname's custom domain
  try {
    const chain = await models.Chain.findOne({ where: { custom_domain: hostname } });
    if (chain) {
      return res.json({ customDomain: chain.id });
    }
  } catch (e) {}

  // otherwise, return false
  return res.json({ customDomain: null });
};

export default domain;
