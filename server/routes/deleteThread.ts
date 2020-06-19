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
    const userOwnedAddressIds = await req.user.getAddresses().filter((addr) => !!addr.verified).map((addr) => addr.id);
    const thread = await models.OffchainThread.findOne({
      where: { id: req.body.thread_id, },
      include: [ models.Chain, models.OffchainCommunity ]
    });
    const isVerifiedOwner = userOwnedAddressIds.indexOf(thread.author_id) !== -1;
    const userRole = await models.Role.findOne({
      where: thread.Chain ? {
        address_id: userOwnedAddressIds,
        chain_id: thread.Chain.id,
      } : {
        address_id: userOwnedAddressIds,
        offchain_community_id: thread.OffchainCommunity.id,
      },
    });
    const isAdminOrMod = userRole?.permission === 'admin' || userRole?.permission === 'moderator';

    if (!isVerifiedOwner && !isAdminOrMod) {
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
