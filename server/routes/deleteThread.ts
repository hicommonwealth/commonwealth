import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

const deleteThread = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.body.thread_id) {
    return next(new Error('Must provide thread_id'));
  }

  try {
    const userOwnedAddresses = await req.user.getAddresses();
    const thread = await models.OffchainThread.findOne({
      where: { id: req.body.thread_id, }
    });
    if (userOwnedAddresses.filter((addr) => addr.verified).map((addr) => addr.id).indexOf(thread.author_id) === -1) {
      return next(new Error('Not owned by this user'));
    }
    const associatedTags = await thread.getTags();
    thread.removeTags(associatedTags);
    // actually delete
    await thread.destroy();
    return res.json({ status: 'Success' });
  } catch (e) {
    return next(e);
  }
};

export default deleteThread;
