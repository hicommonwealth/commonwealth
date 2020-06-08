import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

enum DeleteThreadErrors {
  NoUser = 'Not logged in',
  NoThread = 'Must provide thread_id',
  NoPermission = 'Not owned by this user'
}

const deleteThread = async (models, req: Request, res: Response, next: NextFunction) => {
  const { thread_id } = req.body;
  if (!req.user) {
    return next(new Error(DeleteThreadErrors.NoUser));
  }
  if (!thread_id) {
    return next(new Error(DeleteThreadErrors.NoThread));
  }

  try {
    const userOwnedAddresses = await req.user.getAddresses();
    const thread = await models.OffchainThread.findOne({
      where: { id: req.body.thread_id, },
      include: [ models.Chain, models.OffchainCommunity ]
    });
    if (userOwnedAddresses.filter((addr) => addr.verified).map((addr) => addr.id).indexOf(thread.author_id) === -1) {
      return next(new Error(DeleteThreadErrors.NoPermission));
    }

    const tag = await models.OffchainTag.findOne({
      where: { id: thread.tag_id },
      include: [ { model: models.OffchainThread, as: 'threads' } ]
    });
    const featuredTags = (thread.Chain || thread.OffchainCommunity).featured_tags;
    if (tag && !featuredTags.includes(`${tag.id}`) && tag.threads.length <= 1) {
      tag.destroy();
    }

    await thread.destroy();
    return res.json({ status: 'Success' });
  } catch (e) {
    return next(e);
  }
};

export default deleteThread;
