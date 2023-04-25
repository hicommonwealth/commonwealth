import type { Request, Response } from 'express';
import type { DB } from '../models';

const domain = async (models: DB, req: Request, res: Response) => {
  const hostname = req.headers['x-forwarded-host'] || req.hostname;

  console.log('Handling /api/domain request');
  console.log('Hostname:', hostname);
  console.log('Headers:', req.headers)

  // return the community id matching the hostname's custom domain
  try {
    const chain = await models.Chain.findOne({
      where: { custom_domain: hostname },
    });
    if (chain) {
      return res.json({ customDomain: chain.id });
    }
  } catch (e) {
    console.error('Error fetching custom domain:', e);
    // do nothing
  }

  // otherwise, return false
  return res.json({ customDomain: null });
};

export default domain;
