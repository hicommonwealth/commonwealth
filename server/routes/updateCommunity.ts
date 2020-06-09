import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoCommunityId: 'Must provide community id',
  CantChangeNetwork: 'Cannot change community network',
  CommunityNotFound: 'Community not found',
  NotAdmin: 'Not an admin',
};

const updateCommunity = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body.id) return next(new Error(Errors.NoCommunityId));
  if (req.body.network) return next(new Error(Errors.CantChangeNetwork));

  const community = await models.OffchainCommunity.findOne({
    where: { id: req.body.id }
  });
  if (!community) return next(new Error(Errors.CommunityNotFound));
  else {
    const userAddressIds = await req.user.getAddresses().map((address) => address.id);
    const userRole = await models.Role.findOne({
      where: {
        address_id: userAddressIds,
        offchain_community_id: community.id,
      },
    });
    if (!userRole || userRole.permission !== 'admin') {
      return next(new Error(Errors.NotAdmin));
    }
  }

  if (req.body.name) community.name = req.body.name;
  if (req.body.description) community.description = req.body.description;
  if (req.body['featured_tags[]']) community.featured_tags = req.body['featured_tags[]'];
  community.invitesEnabled = req.body.invites || false;
  community.privacyEnabled = req.body.privacy || false;

  // @TODO -> make sure this gets changed... on the front end, only allow one image to be attached
  if (req.body['attachments[]']) {
    await Promise.all(req.body['attachments[]'].map((url) => models.OffchainAttachment.create({
      attachable: 'community',
      attachment_id: community.id,
      description: 'image',
      url,
    })));

    const finalCommunity = await models.OffchainCommunity.findOne({
      where: { id: community.id },
      include: [ models.Address, models.OffchainAttachment ],
    });

    return res.json({ status: 'Success', result: finalCommunity.toJSON() });
  }

  await community.save();

  return res.json({ status: 'Success', result: community.toJSON() });
};

export default updateCommunity;
