import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { getProposalUrl } from '../../shared/utils';
import { NotificationCategories, ProposalType } from '../../shared/types';

export const Errors = {
  InvalidThread: 'Must provide a valid thread_id',
  InvalidEditor: 'Must provide valid addresses of community members',
  InvalidEditorFormat: 'Editors attribute improperly formatted',
  IncorrectOwner: 'Not owned by this user',
};

const addEditors = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.body?.thread_id) {
    return next(new Error(Errors.InvalidThread));
  }
  const { thread_id } = req.body;
  let editors;
  try {
    editors = JSON.parse(req.body.editors);
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

  const collaborators = await Promise.all(Object.values(editors).map((editor: any) => {
    return models.Address.findOne({
      where: { id: editor.id },
      include: [ models.Role, models.User ]
    });
  }));

  if (collaborators.includes(null)) {
    return next(new Error(Errors.InvalidEditor));
  }

  // Ensure collaborators have community permissions
  if (collaborators?.length > 0) {
    const uniqueCollaborators = [];
    const collaboratorIds = [];
    collaborators.forEach((c) => {
      if (!collaboratorIds.includes(c.User.id)) {
        uniqueCollaborators.push(c);
        collaboratorIds.push(c.User.id);
      }
    });
    await Promise.all(uniqueCollaborators.map(async (collaborator) => {
      if (!collaborator.Roles || !collaborator.User) {
        return null;
      }
      if (community) {
        const isMember = collaborator.Roles
          .find((role) => role.offchain_community_id === community.id);
        if (!isMember) throw new Error(Errors.InvalidEditor);
      } else if (chain) {
        const isMember = collaborator.Roles
          .find((role) => role.chain_id === chain.id);
        if (!isMember) throw new Error(Errors.InvalidEditor);
      }
      const collaboration = await models.Collaboration.findOrCreate({
        where: {
          offchain_thread_id: thread.id,
          address_id: collaborator.id
        }
      });

      // auto-subscribe collaborator to comments & reactions
      // findOrCreate to avoid duplicate subscriptions being created e.g. for
      // same-account collaborators
      await models.Subscription.findOrCreate({
        where: {
          subscriber_id: collaborator.User.id,
          category_id: NotificationCategories.NewComment,
          object_id: `discussion_${thread.id}`,
          offchain_thread_id: thread.id,
          community_id: thread.community || null,
          chain_id: thread.chain || null,
          is_active: true,
        }
      });
      await models.Subscription.findOrCreate({
        where: {
          subscriber_id: collaborator.User.id,
          category_id: NotificationCategories.NewReaction,
          object_id: `discussion_${thread.id}`,
          offchain_thread_id: thread.id,
          community_id: thread.community || null,
          chain_id: thread.chain || null,
          is_active: true,
        }
      });
    })).catch((e) => {
      return next(new Error(e));
    });
  } else {
    return next(new Error(Errors.InvalidEditor));
  }

  await thread.save();

  if (collaborators?.length > 0) await Promise.all(collaborators.map(async (collaborator) => {
    if (!collaborator.User) return; // some Addresses may be missing users, e.g. if the user removed the address

    await models.Subscription.emitNotifications(
      models,
      NotificationCategories.NewCollaboration,
      `user-${collaborator.User.id}`,
      {
        created_at: new Date(),
        root_id: +thread.id,
        root_type: ProposalType.OffchainThread,
        root_title: thread.title,
        comment_text: thread.body,
        chain_id: thread.chain,
        community_id: thread.community,
        author_address: author.address,
        author_chain: author.chain,
      },
      {
        user: author.address,
        url: getProposalUrl('discussion', thread),
        title: req.body.title,
        bodyUrl: req.body.url,
        chain: thread.chain,
        community: thread.community,
        body: thread.body,
      },
      req.wss,
      [ author.address ]
    );
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

export default addEditors;
