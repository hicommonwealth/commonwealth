import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NeedCommunityId: 'Must provide community ID',
  NotCreate: 'Only the original creator can delete this community',
};

const deleteCommunity = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.body.community_id) {
    return next(new Error(Errors.NeedCommunityId));
  }

  try {
    const userOwnedAddresses = await req.user.getAddresses();
    const community = await models.OffchainCommunity.findOne({
      where: { id: req.body.community_id },
    });
    if (userOwnedAddresses.filter((addr) => !!addr.verified).map((addr) => addr.id).indexOf(community.creator_id) === -1) {
      return next(new Error(Errors.NotCreate));
    }
    const communityTags = await community.getTags();
    community.removeTags(communityTags);
    // actually delete
    await community.destroy();
    return res.json({ status: 'Success' });
  } catch (e) {
    return next(e);
  }
};

export default deleteCommunity;
