import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

const updateTags = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error('Not logged in'));
  if (!req.body.thread_id) return next(new Error('Must provide thread_id'));
  if (!req.body.address) return next(new Error('Must provide address'));

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

  let tags: string[] = [];
  if (req.body['tags[]']) {
    if (typeof req.body['tags[]'] === 'string') {
      tags = [req.body['tags[]']];
    } else if (typeof req.body['tags[]'] === 'object') {
      tags = req.body['tags[]'];
    }
  }

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
        community_id: thread.community || null,
        chain_id: thread.community ? null : thread.chain,
      },
    });
    await thread.addTag(newTag);
  }));

  // return new tags
  const finalTags = await thread.getTags();
  return res.json({ status: 'Success', result: finalTags });
};

export default updateTags;
