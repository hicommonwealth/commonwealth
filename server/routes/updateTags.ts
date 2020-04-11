import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import Sequelize from 'sequelize';
import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

const updateTags = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  if (!chain && !community) return next(new Error('Invalid chain or community'));
  if (chain && community) return next(new Error('Invalid chain or community'));
  if (!req.user) return next(new Error('Not logged in'));
  if (!req.body.address_id) return next(new Error('Invalid address'));
  if (!req.body.thread_id) return next(new Error('Must provide thread_id'));
  if (!req.body['tags[]']) return next(new Error('Must provide tags'));

  // check address
  const validAddress = await models.Address.findOne({
    where: {
      id: req.body.address_id,
      user_id: req.user.id,
      verified: { [Sequelize.Op.ne]: null }
    }
  });
  if (!validAddress) return next(new Error('Invalid address'));

  // check mod or admin status
  const chainOrCommObj = chain ? { chain_id: chain.id } : { offchain_community_id: community.id };
  const requesterIsAdminOrMod = await models.Role.findAll({
    where: {
      ...chainOrCommObj,
      address_id: req.user.address,
      permission: ['moderator', 'admin'],
    },
  });

  // lookup thread
  const chainOrCommObjForThread = chain ? { chain: chain.id } : { community: community.id };
  const memberPermissionsCheck = requesterIsAdminOrMod ? {} : { author_id: validAddress.id };
  const thread = await models.OffchainThread.findOne({
    where: {
      ...chainOrCommObjForThread,
      ...memberPermissionsCheck,
      id: req.body.thread_id,
    },
  });

  const tags = req.body['tags[]'];
  const [community_id, chain_id] = [thread.community, thread.authorChain];

  const activeTags = await thread.getTags();

  // remove deleted tags
  const oldTags = activeTags.filter((activeTag) => !tags.includes(activeTag.name));
  await Promise.all(oldTags.map((tag) => thread.removeTag(tag)));

  // create new tags
  const activeNames: any[] = activeTags.map((a) => a.name);
  await Promise.all(tags.filter((tag) => !activeNames.includes(tag)).map(async (tag) => {
    const [newTag] = await models.OffchainTag.findOrCreate({
      where: {
        name: tag,
        community_id: community_id || null,
        chain_id: chain_id || null,
      },
    });
    await thread.addTag(newTag);
  }));

  // return new tags
  const finalTags = await thread.getTags();
  return res.json({ status: 'Success', result: finalTags });
};

export default updateTags;
