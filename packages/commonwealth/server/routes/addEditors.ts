import { AppError } from 'common-common/src/errors';
import { NotificationCategories, ProposalType } from 'common-common/src/types';
import type { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { IThreadCollaborator } from 'models/Thread';
import { Op } from 'sequelize';
import { getThreadUrl } from '../../shared/utils';
import type { DB } from '../models';
import { failure } from '../types';
import emitNotifications from '../util/emitNotifications/emitNotifications';

export const Errors = {
  InvalidThread: 'Must provide a valid thread_id',
  InvalidEditor: 'Must provide valid addresses of community members',
  InvalidEditorFormat: 'Editors attribute improperly formatted',
  IncorrectOwner: 'Not owned by this user',
};

export const addEditorValidation = [
  body('thread_id').isNumeric().withMessage(Errors.InvalidThread),
  body('editors').toArray(),
];

export interface AddEditorsBody {
  thread_id: number;
  editors: IThreadCollaborator[];
}

const addEditors = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  const { thread_id, editors } = req.body as AddEditorsBody;
  const editorChains = new Set(editors.map((e) => e.chain));
  const editorAddresses = new Set(editors.map((e) => e.address));

  const chain = req.chain;
  const author = req.address;

  const thread = await models.Thread.findOne({
    where: {
      id: thread_id,
    },
  });

  if (!thread) return next(new AppError(Errors.InvalidThread));

  const collaborators = await models.Address.findAll({
    where: {
      chain: {
        [Op.in]: Array.from(editorChains),
      },
      address: {
        [Op.in]: Array.from(editorAddresses),
      },
    },
    include: [models.User],
  });

  if (!collaborators) {
    return next(new AppError(Errors.InvalidEditor));
  }

  // Make sure that we query every collaborator provided.
  if (
    collaborators.length !== Math.max(editorChains.size, editorAddresses.size)
  ) {
    return next(new AppError(Errors.InvalidEditor));
  }

  await Promise.all(
    collaborators.map(async (collaborator) => {
      const isMember = collaborator.chain === chain.id;

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
          object_id: String(thread.id),
          thread_id: thread.id,
          chain_id: thread.chain,
          is_active: true,
        },
      });
      await models.Subscription.findOrCreate({
        where: {
          subscriber_id: collaborator.User.id,
          category_id: NotificationCategories.NewReaction,
          object_id: String(thread.id),
          thread_id: thread.id,
          chain_id: thread.chain,
          is_active: true,
        },
      });
    })
  ).catch((e) => {
    return next(new AppError(e));
  });

  await thread.save();

  collaborators.forEach((collaborator) => {
    if (!collaborator.User) return; // some Addresses may be missing users, e.g. if the user removed the address

    emitNotifications(
      models,
      NotificationCategories.NewCollaboration,
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
        url: getThreadUrl(thread),
        title: req.body.title,
        bodyUrl: req.body.url,
        chain: thread.chain,
        body: thread.body,
      },
      [author.address]
    );
  });

  const finalCollaborations = await models.Collaboration.findAll({
    where: { thread_id: thread.id },
    include: [
      {
        model: models.Address,
        as: 'Address',
      },
    ],
  });

  return res.json({
    status: 'Success',
    result: {
      collaborators: finalCollaborations
        .map((c) => c.toJSON())
        .map((c) => c.Address),
    },
  });
};

export default addEditors;
