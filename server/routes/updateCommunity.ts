import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

const updateCommunity = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error('Not logged in'));
  if (!req.body.id) return next(new Error('Must provide community id'));
  if (req.body.network) return next(new Error('Cannot change community network'));

  const community = await models.OffchainCommunity.findOne({
    where: { id: req.body.id }
  });
  if (!community) return next(new Error('community not found'));
  else {
    const userAddressIds = await req.user.getAddresses().map((address) => address.id);
    const userMembership = await models.Role.findOne({
      where: {
        address_id: userAddressIds,
        offchain_community_id: community.id,
      },
    });

    if (userMembership.role.permission !== 'admin') {
      return next(new Error('Invalid community or chain'));
    }
  }

  if (req.body.name) community.setName(req.body.name);
  if (req.body.title) community.setDescription(req.body.description);
  if (req.body['featured_tags[]']) community.featured_tags = req.body['featured_tags[]'];

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
