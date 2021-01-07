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

  try {
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
      commentSubscription = await models.Subscription.findOne({
        subscriber_id: address.user_id,
        category_id: NotificationCategories.NewComment,
        object_id: `discussion_${thread.id}`,
        offchain_thread_id: thread.id,
        community_id: thread.community || null,
        chain_id: thread.chain || null,
        is_active: true,
      });
      reactionSubscription = await models.Subscription.create({
        subscriber_id: address.user_id,
        category_id: NotificationCategories.NewReaction,
        object_id: `discussion_${thread.id}`,
        offchain_thread_id: thread.id,
        community_id: thread.community || null,
        chain_id: thread.chain || null,
        is_active: true,
      });
      await commentSubscription.destroy();
      await reactionSubscription.destroy();
    } catch (err) {
      return next(new Error(err));
    }

    const finalThread = await models.OffchainThread.findOne({
      where: { id: thread.id },
      include: [
        models.Address,
        models.OffchainAttachment,
        { model: models.OffchainTopic, as: 'topic' },
        { model: models.Address, through: models.SharingPermission, as: 'collaborator' },
      ],
    });

    return res.json({ status: 'Success', result: finalThread.toJSON() });
  } catch (e) {
    return next(new Error(e));
  }
};

export default deleteEditor;
