/* eslint-disable quotes */
import { Response, NextFunction } from 'express';

const updateTags = async (models, req, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error('Not logged in'));
  if (!req.body.thread_id) return next(new Error('Must provide thread_id'));
  if (!req.body.address) return next(new Error('Must provide address'));
  if (!req.body.tag_name) return next(new Error('Must provide tag_name'));

  const userAddresses = await req.user.getAddresses();
  const userAddress = userAddresses.find((a) => a.verified && a.address === req.body.address);
  if (!userAddress) return next(new Error('Invalid address'));

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
    return next(new Error(`You do not have permission to edit this post's tags`));
  }

  // remove deleted tags
  let newTag;
  if (req.body.tag_id) {
    thread.tag_id = req.body.tag_id;
    thread.save();
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
    thread.save();
  }
  return res.json({ status: 'Success', result: newTag });
};

export default updateTags;
