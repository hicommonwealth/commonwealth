import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

const updateTags = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error('Not logged in'));
  if (!req.body.thread_id) return next(new Error('Must provide thread_id'));
  if (!req.body.address) return next(new Error('Must provide address'));
  const user = await models.User.findOne({
    where: {
      id: req.user.id,
    },
  });
  const userAddresses = await user.getAddresses();
  const userAddress = userAddresses.find((a) => {
    return a.address === req.body.address;
  });
  const roles: any[] = await models.Role.findAll({
    where: {
      permission: ['admin', 'moderator'],
      address_id: userAddress.id,
    },
  });

  const thread = await models.OffchainThread.findOne({
    where: {
      id: req.body.thread_id,
    },
  });
  const isAuthor = (thread.author_id === userAddress.id);

  const chainOrCommunity = thread.community || thread.chain;
  const isAdminOrMod = roles.map((role) => role.offchain_community_id || role.chaid_id).includes(chainOrCommunity);
  let tags: string[] = [];
  if (req.body['tags[]']) {
    if (typeof req.body['tags[]'] === 'string') {
      tags = [req.body['tags[]']];
    } else if (typeof req.body['tags[]'] === 'object') {
      tags = req.body['tags[]'];
    }
  }
  const [community_id, chain_id] = [thread.community, thread.authorChain];

  const activeTags = await thread.getTags();
  if (!isAdminOrMod && !isAuthor) return res.json({ result: activeTags });

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
