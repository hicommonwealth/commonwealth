import { Response, NextFunction } from 'express';
import { CommunityBannerInstance } from 'server/models/chain_category';
import { success, TypedRequestBody } from '../types';
import { DB } from '../database';
import validateChain from '../util/validateChain';
import validateRoles from '../util/validateRoles';

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
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new Error(UpdateBannerErrors.NoChain));
  const isAdmin = validateRoles(models, req.user, 'admin', chain.id);
  if (!isAdmin) return next(new Error(UpdateBannerErrors.NoPermission));

  const { banner_text } = req.body;
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
  return res.json({ status: 'Success', result: banner.toJSON(), });
};

export default updateBanner;
