import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { renderQuillDeltaToText } from '../../shared/utils';
import { NotificationCategories, ProposalType } from '../../shared/types';

export const Errors = {
  NoThreadId: 'Must provide thread_id',
  InvalidEditor: 'Must provide a valid address of a community member',
  IncorrectOwner: 'Not owned by this user',
};

const editThread = async (models, req: Request, res: Response, next: NextFunction) => {
  const { body, title, kind, thread_id, version_history, } = req.body;

  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  const author = await lookupAddressIsOwnedByUser(models, req, next);

  // TODO: Add member verification logic (InvalidEditor)

  if (!thread_id) {
    return next(new Error(Errors.NoThreadId));
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
    if (!thread) return next(new Error('No thread with that id found'));
    // Editor attachment logic
    await thread.save();
    const finalThread = await models.OffchainThread.findOne({
      where: { id: thread.id },
      include: [ models.Address, models.OffchainAttachment, { model: models.OffchainTopic, as: 'topic' } ],
    });

    // TODO: Hook up editor notifications
    // dispatch notifications to subscribers of the given chain/community
    // await models.Subscription.emitNotifications(
    //   models,
    //   NotificationCategories.ThreadEditorAdded,
    //   '',
    //   {
    //     created_at: new Date(),
    //     root_id: Number(finalThread.id),
    //     root_type: ProposalType.OffchainThread,
    //     root_title: finalThread.title,
    //     chain_id: finalThread.chain,
    //     community_id: finalThread.community,
    //     author_address: finalThread.Address.address
    //   },
    //   // don't send webhook notifications for edits
    //   null,
    //   req.wss,
    //   [ finalThread.Address.address ],
    // );

    return res.json({ status: 'Success', result: finalThread.toJSON() });
  } catch (e) {
    return next(new Error(e));
  }
};

export default editThread;
