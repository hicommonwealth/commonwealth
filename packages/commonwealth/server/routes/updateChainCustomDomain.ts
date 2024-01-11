import { AppError, ServerError } from '@hicommonwealth/adapters';
import { validURL } from '../../shared/utils';
import type { DB } from '../models';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

enum UpdateCustomDomainErrors {
  NoChainID = 'No chain_id provided.',
  NoChain = 'Chain not found.',
  Failed = 'Request Failed.',
  InvalidCustomDomain = 'Invalid custom domain.',
}

type updateCustomDomainReq = {
  secret: string;
  chain_id: string;
  custom_domain: string;
};

type updateCustomDomainResp = {
  result: string;
};

const updateChainCustomDomain = async (
  models: DB,
  req: TypedRequestBody<updateCustomDomainReq>,
  res: TypedResponse<updateCustomDomainResp>,
) => {
  // Verify Chain Exists
  const { chain_id, custom_domain, secret } = req.body;
  if (!chain_id) throw new AppError(UpdateCustomDomainErrors.NoChainID);

  const chain = await models.Community.findOne({
    where: { id: chain_id },
  });
  if (!chain) throw new ServerError(UpdateCustomDomainErrors.NoChain);

  if (!process.env.AIRPLANE_SECRET) {
    throw new AppError(UpdateCustomDomainErrors.Failed);
  }

  // Check secret
  if (process.env.AIRPLANE_SECRET !== secret) {
    throw new AppError(UpdateCustomDomainErrors.Failed);
  }

  // Check custom domain
  if (!validURL(custom_domain)) {
    throw new AppError(UpdateCustomDomainErrors.InvalidCustomDomain);
  }

  // Update Custom Domain
  chain.custom_domain = custom_domain;
  await chain.save();

  return success(res, { result: 'Updated custom domain.' });
};

export default updateChainCustomDomain;
