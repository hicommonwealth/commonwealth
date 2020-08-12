import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
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
      where: {
        id: req.body.thread_id,
        address_id: { [Op.in]: userOwnedAddressIds },
      },
      include: [ models.Chain, models.OffchainCommunity ]
    });
    if (!thread) {
      return next(new Error(DeleteThreadErrors.NoPermission));
    }

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
    if (!isAdminOrMod) {
      return next(new Error(DeleteThreadErrors.NoPermission));
    }

    const topic = await models.OffchainTopic.findOne({
      where: { id: thread.topic_id },
      include: [ { model: models.OffchainThread, as: 'threads' } ]
    });
    const featuredTopics = (thread.Chain || thread.OffchainCommunity).featured_topics;
    if (topic && !featuredTopics.includes(`${topic.id}`) && topic.threads.length <= 1) {
      topic.destroy();
    }

    // find and delete all associated subscriptions
    const subscriptions = await models.Subscription.findAll({
      where: {
        offchain_thread_id: thread.id,
      },
    });
    await Promise.all(subscriptions.map((s) => {
      return s.destroy();
    }));

    await thread.destroy();
    return res.json({ status: 'Success' });
  } catch (e) {
    return next(e);
  }
};

export default deleteThread;
