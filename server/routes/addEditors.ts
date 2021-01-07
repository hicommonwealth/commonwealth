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
  let editors;
  try {
    editors = JSON.parse(req.body.editors);
  } catch (e) {
    console.log('Editors attribute improperly formatted.');
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
    // Editor attachment logic
    let collaborators;

    try {
      collaborators = await Promise.all(Object.values(editors).map(async (editor: any) => {
        const collaborator =  models.Address.findOne({
          where: { id: editor.id },
          include: [ models.Role, models.User ]
        });
        return collaborator;
      }));
    } catch (e) {
      console.log(e);
      return next(new Error(Errors.InvalidEditor));
    }

    // Ensure collaborators have community permissions
    if (collaborators?.length > 0) {
      await Promise.all(collaborators.map(async (collaborator) => {
        if (community) {
          const isMember = collaborator.Roles
            .find((role) => role.offchain_community_id === community.id);
          if (!isMember) return next(new Error(Errors.InvalidEditor));
        } else if (chain) {
          const isMember = collaborator.Roles
            .find((role) => role.chain_id === chain.id);
          if (!isMember) return next(new Error(Errors.InvalidEditor));
        }
        const collaboration = await models.SharingPermission.findOrCreate({
          where: {
            offchain_thread_id: thread.id,
            address_id: collaborator.id
          }
        });

        // auto-subscribe collaborator to comments & reactions
        try {
          await models.Subscription.create({
            subscriber_id: collaborator.User.id,
            category_id: NotificationCategories.NewComment,
            object_id: `discussion_${thread.id}`,
            offchain_thread_id: thread.id,
            community_id: thread.community || null,
            chain_id: thread.chain || null,
            is_active: true,
          });
          await models.Subscription.create({
            subscriber_id: req.user.id,
            category_id: NotificationCategories.NewReaction,
            object_id: `discussion_${thread.id}`,
            offchain_thread_id: thread.id,
            community_id: thread.community || null,
            chain_id: thread.chain || null,
            is_active: true,
          });
        } catch (err) {
          return next(new Error(err));
        }
      }));
    } else {
      return next(new Error(Errors.InvalidEditor));
    }

    await thread.save();
    const finalThread = await models.OffchainThread.findOne({
      where: { id: thread.id },
      include: [
        models.OffchainAttachment,
        { model: models.Address, as: 'Address' },
        { model: models.OffchainTopic, as: 'topic' },
        { model: models.Address, through: models.SharingPermission, as: 'collaborator' },
      ],
    });

    // TODO: Build and test notifications
    if (collaborators?.length > 0) await Promise.all(collaborators.map(async (collaborator) => {
      if (!collaborator.User) return; // some Addresses may be missing users, e.g. if the user removed the address

      await models.Subscription.emitNotifications(
        models,
        NotificationCategories.NewCollaboration,
        `user-${collaborator.User.id}`,
        {
          created_at: new Date(),
          root_id: Number(finalThread.id),
          root_type: ProposalType.OffchainThread,
          root_title: finalThread.title,
          comment_text: finalThread.body,
          chain_id: finalThread.chain,
          community_id: finalThread.community,
          author_address: finalThread.Address.address,
          author_chain: finalThread.Address.chain,
        },
        {
          user: finalThread.Address.address,
          url: getProposalUrl('discussion', finalThread),
          title: req.body.title,
          bodyUrl: req.body.url,
          chain: finalThread.chain,
          community: finalThread.community,
          body: finalThread.body,
        },
        req.wss,
        [ finalThread.Address.address ],
      );
    }));

    return res.json({ status: 'Success' });
  } catch (e) {
    return next(new Error(e));
  }
};

export default addEditors;
