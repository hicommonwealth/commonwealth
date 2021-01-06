import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { getProposalUrl } from '../../shared/utils';
import { NotificationCategories, ProposalType } from '../../shared/types';

export const Errors = {
  InvalidThread: 'Must provide a valid thread_id',
  InvalidEditor: 'Must provide valid addresses of community members',
  IncorrectOwner: 'Not owned by this user',
};

const addEditors = async (models, req: Request, res: Response, next: NextFunction) => {
  const { thread_id } = req.body;

  if (!req.body.editor_chain || !req.body.editor_address) {
    console.log('Must provide editor address and chain.');
  }
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  const author = await lookupAddressIsOwnedByUser(models, req, next);

  if (!thread_id) {
    return next(new Error(Errors.InvalidThread));
  }

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

    const collaboration = await models.SharingPermission.findOrCreate({
      where: {
        offchain_thread_id: thread.id,
        address_id: address.id
      }
    });
    collaboration.delete();

    // TODO: Delete subscriptions
    // try {
    //   await models.Subscription.create({
    //     subscriber_id: collaborator.User.id,
    //     category_id: NotificationCategories.NewComment,
    //     object_id: `discussion_${thread.id}`,
    //     offchain_thread_id: thread.id,
    //     community_id: thread.community || null,
    //     chain_id: thread.chain || null,
    //     is_active: true,
    //   });
    //   await models.Subscription.create({
    //     subscriber_id: req.user.id,
    //     category_id: NotificationCategories.NewReaction,
    //     object_id: `discussion_${thread.id}`,
    //     offchain_thread_id: thread.id,
    //     community_id: thread.community || null,
    //     chain_id: thread.chain || null,
    //     is_active: true,
    //   });
    // } catch (err) {
    //   return next(new Error(err));
    // }

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

export default addEditors;
