import { AppError } from 'common-common/src/errors';
import { NotificationCategories, ProposalType } from 'common-common/src/types';
import type { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import { getThreadUrl } from '../../shared/utils';
import type { DB } from '../models';
import emitNotifications from '../util/emitNotifications';
import { findOneRole } from '../util/roles';

export const Errors = {
  InvalidThread: 'Must provide a valid thread_id',
  InvalidEditor: 'Must provide valid addresses of community members',
  InvalidEditorFormat: 'Editors attribute improperly formatted',
  IncorrectOwner: 'Not owned by this user',
};

const addEditors = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body?.thread_id) {
    return next(new AppError(Errors.InvalidThread));
  }
  const { thread_id } = req.body;
  let editors;
  try {
    editors = JSON.parse(req.body.editors);
  } catch (e) {
    return next(new AppError(Errors.InvalidEditorFormat));
  }

  const chain = req.chain;

  const author = req.address;

  const userOwnedAddressIds = (await req.user.getAddresses())
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);
  const thread = await models.Thread.findOne({
    where: {
      id: thread_id,
      address_id: { [Op.in]: userOwnedAddressIds },
    },
  });
  if (!thread) return next(new AppError(Errors.InvalidThread));

  const collaborators = await Promise.all(
    Object.values(editors).map((editor: any) => {
      return models.Address.findOne({
        where: { id: editor.id },
        include: [models.RoleAssignment, models.User],
      });
    })
  );

  if (collaborators.includes(null)) {
    return next(new AppError(Errors.InvalidEditor));
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
    await Promise.all(
      uniqueCollaborators.map(async (collaborator) => {
        if (!collaborator.RoleAssignments || !collaborator.User) {
          return null;
        }
        const isMember = await findOneRole(
          models,
          { where: { address_id: collaborator.id } },
          chain.id
        );

        if (!isMember) throw new AppError(Errors.InvalidEditor);

        await models.Collaboration.findOrCreate({
          where: {
            thread_id: thread.id,
            address_id: collaborator.id,
          },
        });
        // auto-subscribe collaborator to comments & reactions
        // findOrCreate to avoid duplicate subscriptions being created e.g. for
        // same-account collaborators
        await models.Subscription.findOrCreate({
          where: {
            subscriber_id: collaborator.User.id,
            category_id: NotificationCategories.NewComment,
            object_id: thread.id,
            offchain_thread_id: thread.id,
            chain_id: thread.chain,
            is_active: true,
          },
        });
        await models.Subscription.findOrCreate({
          where: {
            subscriber_id: collaborator.User.id,
            category_id: NotificationCategories.NewReaction,
            object_id: thread.id,
            offchain_thread_id: thread.id,
            chain_id: thread.chain,
            is_active: true,
          },
        });
      })
    ).catch((e) => {
      return next(new AppError(e));
    });
  } else {
    return next(new AppError(Errors.InvalidEditor));
  }

  await thread.save();

  if (collaborators?.length > 0) {
    collaborators.map((collaborator) => {
      if (!collaborator.User) return; // some Addresses may be missing users, e.g. if the user removed the address

      emitNotifications(
        models,
        NotificationCategories.NewCollaboration,
        `user-${collaborator.User.id}`,
        {
          created_at: new Date(),
          thread_id: +thread.id,
          root_type: ProposalType.Thread,
          root_title: thread.title,
          comment_text: thread.body,
          chain_id: thread.chain,
          author_address: author.address,
          author_chain: author.chain,
        },
        {
          user: author.address,
          url: getThreadUrl('discussion', thread),
          title: req.body.title,
          bodyUrl: req.body.url,
          chain: thread.chain,
          body: thread.body,
        },
        [author.address]
      );
    });
  }

  const finalCollaborations = await models.Collaboration.findAll({
    where: { thread_id: thread.id },
    include: [
      {
        model: models.Address,
        as: 'Address',
      },
    ],
  });

  const finalAddresses = await Promise.all(
    finalCollaborations.map((e) => e.getAddress())
  );

  return res.json({
    status: 'Success',
    result: {
      collaborators: finalAddresses.map((a) => a.toJSON()),
    },
  });
};

export default addEditors;
