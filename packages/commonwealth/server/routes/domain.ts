import type { DB } from '@hicommonwealth/model';
import type { Request, Response } from 'express';

const domain = async (models: DB, req: Request, res: Response) => {
  const hostname = req.headers['x-forwarded-host'] || req.hostname;

  // return the community id matching the hostname's custom domain
  try {
    const community = await models.Community.findOne({
      where: { custom_domain: hostname },
    });
    if (community) {
      return res.json({ customDomain: community.id });
    }
  } catch (e) {
    // do nothing
  }

  // otherwise, return false
  return res.json({ customDomain: null });
};

export default domain;
