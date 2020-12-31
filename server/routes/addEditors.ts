import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { getProposalUrl } from '../../shared/utils';
import { NotificationCategories, ProposalType } from '../../shared/types';

export const Errors = {
  NoThreadId: 'Must provide thread_id',
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
    return next(new Error(Errors.NoThreadId));
  }

  let thread;
  try {
    const userOwnedAddressIds = await (req.user as any).getAddresses()
      .filter((addr) => !!addr.verified).map((addr) => addr.id);
    thread = await models.OffchainThread.findOne({
      where: {
        id: thread_id,
        address_id: { [Op.in]: userOwnedAddressIds },
      },
    });
    if (!thread) return next(new Error('No thread with that id found'));
    // Editor attachment logic
    let collaborators;

    try {
      collaborators = await Promise.all(Object.values(editors).map(async (editor: any) => {
        const collaborator =  models.Address.findOne({
          where: { id: editor.id },
          include: [ models.Role, models.User ]
        });
        console.log(collaborator);
        return collaborator;
      }));
    } catch (e) {
      console.log(e);
      return next(new Error(Errors.InvalidEditor));
    }
    console.log(collaborators);
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
        const collaboration = await models.SharingPermission.create({
          thread_id: thread.id,
          address_id: collaborator.id
        });

        // auto-subscribe collaborator to comments & reactions
        if (collaborator.User) {
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
        } else {
          console.log(collaborator);
        }
      }));
    } else {
      return next(new Error(Errors.InvalidEditor));
    }

    if (collaborators?.length > 0) await Promise.all(collaborators.map(async (collaborator) => {
      if (!collaborator.User) return; // some Addresses may be missing users, e.g. if the user removed the address

      await models.Subscription.emitNotifications(
        models,
        NotificationCategories.NewCollaboration,
        `user-${collaborator.User.id}`,
        {
          created_at: new Date(),
          root_id: Number(thread.id),
          root_type: ProposalType.OffchainThread,
          root_title: thread.title,
          comment_text: thread.body,
          chain_id: thread.chain,
          community_id: thread.community,
          author_address: thread.Address.address,
          author_chain: thread.Address.chain,
        },
        {
          user: thread.Address.address,
          url: getProposalUrl('discussion', thread),
          title: req.body.title,
          bodyUrl: req.body.url,
          chain: thread.chain,
          community: thread.community,
          body: thread.body,
        },
        req.wss,
        [ thread.Address.address ],
      );
    }));

    // TODO: Examine returned result for relevance
    return res.json({ status: 'Success', result: finalThread.toJSON() });
  } catch (e) {
    return next(new Error(e));
  }
};

export default addEditors;
