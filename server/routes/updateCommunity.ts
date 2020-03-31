import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

const updateCommunity = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.user.isAdmin) {
    return next(new Error('Must be admin'));
  }
  if (!req.body.id) {
    return next(new Error('Must provide community id'));
  }
  if (req.body.network) {
    return next(new Error('Cannot change community network'));
  }

  const community = await models.OffchainCommunity.findOne({
    where: { id: req.body.id }
  });
  if (!community) {
    return next(new Error('community not found'));
  }

  if (req.body.name) {
    community.setName(req.body.name);
  }
  //
  if (req.body.title) {
    community.setDescription(req.body.description);
  }

  // @TODO -> make sure this gets changed... on the front end, only allow one image to be attached
  if (req.body['attachments[]']) {
    await Promise.all(req.body['attachments[]'].map((url) => models.OffchainAttachment.create({
      attachable: 'community',
      attachment_id: community.id,
      url: url,
      description: 'image',
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
