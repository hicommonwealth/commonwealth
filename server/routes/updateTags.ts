/* eslint-disable quotes */
import { Response, NextFunction } from 'express';

enum UpdateTagsErrors {
  NoUser = 'Not logged in',
  NoThread = 'Must provide thread_id',
  NoAddr = 'Must provide address',
  NoTag = 'Must provide tag_name',
  InvalidAddr = 'Invalid address',
  NoPermission = `You do not have permission to edit post's tags`
}

const updateTags = async (models, req, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error(UpdateTagsErrors.NoUser));
  if (!req.body.thread_id) return next(new Error(UpdateTagsErrors.NoThread));
  if (!req.body.address) return next(new Error(UpdateTagsErrors.NoAddr));
  if (!req.body.tag_name) return next(new Error(UpdateTagsErrors.NoTag));

  const userAddresses = await req.user.getAddresses();
  const userAddress = userAddresses.find((a) => a.verified && a.address === req.body.address);
  if (!userAddress) return next(new Error(UpdateTagsErrors.InvalidAddr));

  const thread = await models.OffchainThread.findOne({
    where: {
      id: req.body.thread_id,
    },
  });

  const roles: any[] = await models.Role.findAll({
    where: thread.community ? {
      permission: ['admin', 'moderator'],
      address_id: userAddress.id,
      offchain_community_id: thread.community,
    } : {
      permission: ['admin', 'moderator'],
      address_id: userAddress.id,
      chain_id: thread.chain,
    },
  });
  const isAdminOrMod = roles.length > 0;
  const isAuthor = (thread.author_id === userAddress.id);
  if (!isAdminOrMod && !isAuthor) {
    return next(new Error(UpdateTagsErrors.NoPermission));
  }

  // remove deleted tags
  let newTag;
  if (req.body.tag_id) {
    thread.tag_id = req.body.tag_id;
    await thread.save();
    newTag = await models.OffchainTag.findOne({
      where: { id: req.body.tag_id }
    });
  } else {
    [newTag] = await models.OffchainTag.findOrCreate({
      where: {
        name: req.body.tag_name,
        community_id: thread.community || null,
        chain_id: thread.community ? null : thread.chain,
      },
    });
    thread.tag_id = newTag.id;
    await thread.save();
  }
  return res.json({ status: 'Success', result: newTag });
};

export default updateTags;
