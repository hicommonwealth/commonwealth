import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

const updateTags = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error('Not logged in'));
  if (!req.body.thread_id) return next(new Error('Must provide thread_id'));
  if (!req.body['tags[]']) return next(new Error('Must provide tags'));

  const tags = req.body['tags[]'];

  const thread = await models.OffchainThread.findOne({
    where: {
      id: req.body.thread_id,
    },
  });

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
