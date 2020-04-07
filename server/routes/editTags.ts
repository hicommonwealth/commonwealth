import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

const editTags = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.body.thread_id) {
    return next(new Error('Must provide thread_id'));
  }
  if (!req.body.community_id && !req.body.chain_id) {
    return next(new Error('Must provide community_id or chain_id'));
  }
  if (!req.body.tags) {
    return next(new Error('Must provide tags: string[]'));
  }

  const { thread_id, community_id, chain_id, tags } = req.body;

  try {
    const activeTags = await models.OffchainTag.findAll({
      where: {
        thread_id,
      },
    });
    // remove deleted tags
    const oldTags = activeTags.filter((activeTag) => {
      return !tags.includes(activeTag.name); // not included in tags
    });
    await oldTags.map(async (tag) => {
      await tag.destroy();
    });
    // create new tags
    const newTags = tags.filter((tag) => {
      return activeTags.map((a) => a.name).indexOf(tag) === -1;
    });

    const addTags = [];
    await newTags.map(async (tag) => {
      addTags.push(await models.OffchainTag.create({
        thread_id,
        name: tag,
        community_id,
        chain_id,
      }));
    });

    return res.json({ status: 'Success', result: { addTags, oldTags } });
  } catch (e) {
    return next(e);
  }
};

export default editTags;
