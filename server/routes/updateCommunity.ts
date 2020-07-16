import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { urlHasValidHTTPPrefix } from 'client/scripts/helpers';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoCommunityId: 'Must provide community ID',
  CantChangeNetwork: 'Cannot change community network',
  CommunityNotFound: 'Community not found',
  NotAdmin: 'Not an admin',
  InvalidWebsite: 'Website must have valid http prefix',
  InvalidChat: 'Chat must have valid http prefix'
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
    const userAddressIds = await req.user.getAddresses().filter((addr) => !!addr.verified).map((addr) => addr.id);
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

  const { chat, description, invites, name, privacy, website } = req.body;

  if (website.length && !urlHasValidHTTPPrefix(website)) {
    return next(new Error(Errors.InvalidWebsite));
  } else if (chat.length && !urlHasValidHTTPPrefix(chat)) {
    return next(new Error(Errors.InvalidChat));
  }

  if (req.body.name) community.name = req.body.name;
  if (req.body['featured_tags[]']) community.featured_tags = req.body['featured_tags[]'];
  community.description = description;
  community.website = website;
  community.chat = chat;
  community.invitesEnabled = invites || false;
  community.privacyEnabled = privacy || false;
  await community.save();

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

  return res.json({ status: 'Success', result: community.toJSON() });
};

export default updateCommunity;
