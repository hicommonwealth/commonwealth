import { Response, NextFunction } from 'express';
import { TypedRequestBody } from '../types';
import { DB } from '../database';

type updateCustomDomainReq = {
  secret: string;
  chain_id: string;
  custom_domain: string;
};

const updateChainCustomDomain = async (
  models: DB,
  req: TypedRequestBody<updateCustomDomainReq>,
  res: Response,
  next: NextFunction
) => {
  if (!req.body) {
    return next(new Error('invalid request body'));
  }
  // Verify Chain Exists
  const { chain_id, custom_domain, secret } = req.body;
  const chain = await models.Chain.findOne({
    where: { id: chain_id },
  });
  if (!chain) return next(new Error('Chain not found.'));

  // Check secret
  if (process.env.CUSTOM_DOMAIN_UPDATE_SECRET !== secret) {
    return next(new Error('Invalid secret.'));
  }

  // Update Custom Domain
  chain.custom_domain = custom_domain;
  await chain.save();

  return res.json({ status: 'success', result: 'Updated custom domain.' });
};

export default updateChainCustomDomain;
