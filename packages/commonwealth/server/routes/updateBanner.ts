import { AppError } from '@hicommonwealth/core';
import type { CommunityBannerInstance, DB } from '@hicommonwealth/model';
import type { Response } from 'express';
import type { TypedRequestBody } from '../types';
import { success } from '../types';
import { validateOwner } from '../util/validateOwner';

enum UpdateBannerErrors {
  NoPermission = `You do not have permission to update banner`,
}

type UpdateBannerReq = Omit<CommunityBannerInstance, 'id'> & {
  community_id: string;
  banner_text: string;
};

const updateBanner = async (
  models: DB,
  req: TypedRequestBody<UpdateBannerReq>,
  res: Response,
) => {
  const { community } = req;

  const isAdmin = await validateOwner({
    models: models,
    user: req.user,
    communityId: community.id,
    allowAdmin: true,
    allowSuperAdmin: true,
  });
  if (!isAdmin) {
    throw new AppError(UpdateBannerErrors.NoPermission);
  }

  const banner_text = req.body?.banner_text || '';

  // find or create
  const [banner] = await models.CommunityBanner.findOrCreate({
    where: {
      community_id: community.id,
    },
    defaults: {
      community_id: community.id,
      banner_text,
    },
  });
  if (banner_text !== banner.banner_text) {
    // update if need be
    banner.banner_text = banner_text;
    await banner.save();
  }
  return success(res, banner.toJSON());
};

export default updateBanner;
