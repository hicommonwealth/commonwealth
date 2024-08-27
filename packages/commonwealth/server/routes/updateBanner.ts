import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import type { Response } from 'express';
import type { TypedRequestBody } from '../types';
import { success } from '../types';
import { validateOwner } from '../util/validateOwner';

enum UpdateBannerErrors {
  NoPermission = `You do not have permission to update banner`,
}

type UpdateBannerReq = {
  community_id: string;
  banner_text: string;
};

// TODO in #9012: this route should be rolled into the updateCommunity route
const updateBanner = async (
  models: DB,
  req: TypedRequestBody<UpdateBannerReq>,
  res: Response,
) => {
  const { community } = req;

  const isAdmin = await validateOwner({
    models: models,
    // @ts-expect-error StrictNullChecks
    user: req.user,
    // @ts-expect-error StrictNullChecks
    communityId: community.id,
    allowAdmin: true,
    allowSuperAdmin: true,
  });
  if (!isAdmin) {
    throw new AppError(UpdateBannerErrors.NoPermission);
  }

  const banner_text = req.body?.banner_text || '';

  if (community && banner_text !== community.banner_text) {
    community.banner_text = banner_text;
    await community.save();
  }
  return success(res, { banner_text });
};

export default updateBanner;
