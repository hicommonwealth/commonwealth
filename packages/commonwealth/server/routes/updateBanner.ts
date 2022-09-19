import { Response, NextFunction } from 'express';
import { AppError } from 'common-common/src/errors';
import { success, TypedRequestBody } from '../types';
import { DB } from '../database';
import validateChain from '../util/validateChain';
import validateRoles from '../util/validateRoles';
import { CommunityBannerInstance } from '../models/community_banner';

enum UpdateBannerErrors {
  NoChain = 'Must supply a chain ID',
  NoPermission = `You do not have permission to update banner`,
}


type UpdateBannerReq = Omit<CommunityBannerInstance, 'id'> & {
  chain_id: string;
  banner_text: string;
};

const updateBanner = async (
  models: DB,
  req: TypedRequestBody<UpdateBannerReq>,
  res: Response,
) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) throw new AppError(UpdateBannerErrors.NoChain);
  const isAdmin = await validateRoles(models, req.user, 'admin', chain.id);
  if (!isAdmin) throw new AppError(UpdateBannerErrors.NoPermission);

  const { banner_text } = req.body || {banner_text: ''};

  // find or create
  const [banner] = await models.CommunityBanner.findOrCreate({
    where: {
      chain_id: chain.id,
    },
    defaults: {
      chain_id: chain.id,
      banner_text
    },
  });
  if (banner_text !== banner.banner_text) {
    // update if need be
    banner.banner_text = banner_text;
    banner.save();
  }
  return success(res, banner.toJSON());
};

export default updateBanner;
