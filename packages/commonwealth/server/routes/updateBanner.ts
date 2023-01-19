import { AppError } from 'common-common/src/errors';
import type { Response } from 'express';
import type { DB } from '../models';
import type { CommunityBannerInstance } from '../models/community_banner';
import type { TypedRequestBody } from '../types';
import { success } from '../types';
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
  res: Response
) => {
  const chain = req.chain;
  const isAdmin = await validateRoles(models, req.user, 'admin', chain.id);
  if (!isAdmin) throw new AppError(UpdateBannerErrors.NoPermission);

  const { banner_text } = req.body || { banner_text: '' };

  // find or create
  const [banner] = await models.CommunityBanner.findOrCreate({
    where: {
      chain_id: chain.id,
    },
    defaults: {
      chain_id: chain.id,
      banner_text,
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
