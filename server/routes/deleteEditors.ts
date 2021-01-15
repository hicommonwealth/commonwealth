import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { NotificationCategories } from '../../shared/types';

export const Errors = {
  InvalidThread: 'Must provide a valid thread_id',
  InvalidEditor: 'Must provide valid addresses of existing editor',
  InvalidEditorFormat: 'Editors attribute improperly formatted.',
  IncorrectOwner: 'Not owned by this user',
  InvalidAddress: 'Must provide editor address and chain',
};

const deleteEditors = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.body.thread_id) {
    return next(new Error(Errors.InvalidThread));
  }
  const { thread_id } = req.body;
  let editors;
  try {
    const editorsObj = JSON.parse(req.body.editors);
    editors = Object.values(editorsObj);
  } catch (e) {
    return next(new Error(Errors.InvalidEditorFormat));
  }
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

  await Promise.all(editors.map(async (editor: any) => {
    const address = await models.Address.findOne({
      where: {
        chain: editor.chain,
        address: editor.address,
      }
    });
    const collaboration = await models.Collaboration.findOne({
      where: {
        offchain_thread_id: thread.id,
        address_id: address.id
      }
    });
    let commentSubscription;
    let reactionSubscription;
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
      });
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
      });
      if (collaboration) {
        await collaboration.destroy({}, { transaction: t });
      }
      if (commentSubscription) {
        await commentSubscription.destroy({}, { transaction: t });
      }
      if (reactionSubscription) {
        await reactionSubscription.destroy({}, { transaction: t });
      }
    });
  }));

  const finalEditors = await models.Collaboration.findAll({
    where: { offchain_thread_id: thread.id },
    include: [{
      model: models.Address,
    }]
  });

  return res.json({
    status: 'Success',
    result: {
      collaborators: finalEditors.map((e) => e.Address.toJSON())
    },
  });
};

export default deleteEditors;
