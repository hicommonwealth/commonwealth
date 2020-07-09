import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  Unimplemented: 'Unimplemented',
  NotLoggedIn: 'Not logged in',
  NeedCommunityId: 'Must provide community ID',
  NotCreate: 'Only the original creator can delete this community',
};

const deleteCommunity = async (models, req: Request, res: Response, next: NextFunction) => {
  // TODO: re-implement this route if we decide that admins should be able to delete a community
  return next(new Error(Errors.Unimplemented));

  // if (!req.user) {
  //   return next(new Error(Errors.NotLoggedIn));
  // }
  // if (!req.body.community_id) {
  //   return next(new Error(Errors.NeedCommunityId));
  // }

  // try {
  //   const userOwnedAddressIds = await req.user.getAddresses().filter((addr) => !!addr.verified).map((addr) => addr.id);
  //   const community = await models.OffchainCommunity.findOne({
  //     where: {
  //       id: req.body.community_id,
  //       address_id: { [Op.in]: userOwnedAddressIds },
  //     },
  //   });
  //   const communityTags = await community.getTags();
  //   community.removeTags(communityTags);
  //   // actually delete
  //   await community.destroy();
  //   return res.json({ status: 'Success' });
  // } catch (e) {
  //   return next(e);
  // }
};

export default deleteCommunity;
