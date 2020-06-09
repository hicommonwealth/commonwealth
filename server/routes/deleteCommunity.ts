import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

const deleteCommunity = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.body.community_id) {
    return next(new Error('Must provide community_id'));
  }

  try {
    const userOwnedAddresses = await req.user.getAddresses();
    const community = await models.OffchainCommunity.findOne({
      where: { id: req.body.community_id },
    });
    if (userOwnedAddresses.filter((addr) => addr.verified).map((addr) => addr.id).indexOf(community.creator_id) === -1) {
      return next(new Error('Only the original creator can delete this community'));
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
