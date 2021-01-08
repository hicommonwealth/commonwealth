import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { NotificationCategories } from '../../shared/types';

export const Errors = {
  InvalidThread: 'Must provide a valid thread_id',
  InvalidEditor: 'Must provide valid addresses of community members',
  IncorrectOwner: 'Not owned by this user',
  InvalidAddress: 'Must provide editor address and chain'
};

const deleteEditor = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.body.thread_id) {
    return next(new Error(Errors.InvalidThread));
  }
  if (!req.body.editor_chain || !req.body.editor_address) {
    return next(new Error(Errors.InvalidAddress));
  }
  const { thread_id } = req.body;
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  const author = await lookupAddressIsOwnedByUser(models, req, next);

  const userOwnedAddressIds = await (req.user as any).getAddresses()
    .filter((addr) => !!addr.verified).map((addr) => addr.id);
  const thread = await models.OffchainThread.findOne({
    where: {
      id: thread_id,
      address_id: { [Op.in]: userOwnedAddressIds },
    },
  });
  if (!thread) return next(new Error(Errors.InvalidThread));

  const address = await models.Address.find({
    where: {
      chain: req.body.editor_chain,
      address: req.body.editor_address,
    }
  });

  const collaboration = await models.SharingPermission.findOne({
    where: {
      offchain_thread_id: thread.id,
      address_id: address.id
    }
  });

  await collaboration.destroy();

  // TODO: Delete subscriptions

  let commentSubscription;
  let reactionSubscription;
  try {
    await models.sequelize.transaction(async (t) => {
      commentSubscription = await models.Subscription.findOne({
        where: {
          subscriber_id: address.user_id,
          category_id: NotificationCategories.NewComment,
          object_id: `discussion_${thread.id}`,
          offchain_thread_id: thread.id,
          community_id: thread.community || null,
          chain_id: thread.chain || null,
          is_active: true,
        }
      }, { transaction: t });
      reactionSubscription = await models.Subscription.findOne({
        where: {
          subscriber_id: address.user_id,
          category_id: NotificationCategories.NewReaction,
          object_id: `discussion_${thread.id}`,
          offchain_thread_id: thread.id,
          community_id: thread.community || null,
          chain_id: thread.chain || null,
          is_active: true,
        }
      }, { transaction: t });
      await commentSubscription.destroy({}, { transaction: t });
      await reactionSubscription.destroy({}, { transaction: t });
    });
  } catch (err) {
    return next(new Error('Removing editor subscriptions failed'));
  }

  return res.json({ status: 'Success' });
};

export default deleteEditor;
