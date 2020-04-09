import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

const updateTags = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.body.thread_id) {
    return next(new Error('Must provide thread_id'));
  }
  if (!req.body['tags[]']) {
    return next(new Error('Must provide tags: string[]'));
  }

  console.dir(req.body);
  const { thread_id } = req.body;
  const tags = req.body['tags[]'];

  const thread = await models.OffchainThread.findOne({
    where: {
      id: thread_id,
    },
  });

  const [community_id, chain_id] = [thread.community, thread.authorChain];

  try {
    // const activeTags = await models.OffchainTag.findAll({
    //   where: {
    //     thread_id,
    //   },
    // });
    const activeTags: any[] = await thread.getTags();
    // console.dir(activeTags);

    // remove deleted tags
    const oldTags = activeTags.filter((activeTag) => {
      return !tags.includes(activeTag.name); // not included in tags
    });
    console.dir(oldTags);
    console.dir('removing old tags');
    await Promise.all(oldTags.map(async (tag) => {
      await thread.removeTag(tag);
    }));
    // create new tags
    const activeNames: any[] = activeTags.map((a) => a.name);
    const newTags = tags.filter((tag) => {
      return !activeNames.includes(tag);
    });

    await Promise.all(newTags.map(async (tag) => {
      const [newTag] = await models.OffchainTag.findOrCreate({
        where: {
          name: tag,
          community_id: community_id || null,
          chain_id: chain_id || null,
        },
      });
      await thread.addTag(newTag);
    }));
    const returnTags = await thread.getTags();
    console.dir(returnTags);
    return res.json({ status: 'Success', result: returnTags });
  } catch (e) {
    return next(e);
  }
};

export default updateTags;
