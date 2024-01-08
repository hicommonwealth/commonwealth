import { AppError, ServerError } from 'common-common/src/errors';
import { validURL } from '../../shared/utils';
import type { DB } from '../models';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

enum UpdateCustomDomainErrors {
  NoCommunityID = 'No community_id provided.',
  NoCommunity = 'Community not found.',
  Failed = 'Request Failed.',
  InvalidCustomDomain = 'Invalid custom domain.',
}

type updateCustomDomainReq = {
  secret: string;
  community_id: string;
  custom_domain: string;
};

type updateCustomDomainResp = {
  result: string;
};

const updateCommunityCustomDomain = async (
  models: DB,
  req: TypedRequestBody<updateCustomDomainReq>,
  res: TypedResponse<updateCustomDomainResp>,
) => {
  // Verify Community Exists
  const { community_id, custom_domain, secret } = req.body;
  if (!community_id) throw new AppError(UpdateCustomDomainErrors.NoCommunityID);

  const community = await models.Community.findOne({
    where: { id: community_id },
  });
  if (!community) throw new ServerError(UpdateCustomDomainErrors.NoCommunity);

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
  community.custom_domain = custom_domain;
  await community.save();

  return success(res, { result: 'Updated custom domain.' });
};

export default updateCommunityCustomDomain;
