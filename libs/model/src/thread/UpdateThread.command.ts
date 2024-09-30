import {
  Actor,
  InvalidActor,
  InvalidInput,
  type Command,
} from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op, Sequelize } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';
import { isAuthorized, type AuthContext } from '../middleware';
import { mustBeAuthorizedThread, mustExist } from '../middleware/guards';
import {
  ThreadAttributes,
  ThreadInstance,
  getThreadSearchVector,
} from '../models/thread';
import {
  decodeContent,
  emitMentions,
  findMentionDiff,
  parseUserMentions,
  quillToPlain,
  sanitizeQuillText,
  uploadIfLarge,
} from '../utils';

export const UpdateThreadErrors = {
  ThreadNotFound: 'Thread not found',
  InvalidStage: 'Please Select a Stage',
  MissingCollaborators: 'Failed to find all provided collaborators',
  CollaboratorsOverlap:
    'Cannot overlap addresses when adding/removing collaborators',
  ContestLock: 'Cannot edit thread that is in a contest',
};

function getContentPatch(
  thread: ThreadInstance,
  {
    title,
    body,
    url,
    canvas_msg_id,
    canvas_signed_data,
  }: z.infer<typeof schemas.UpdateThread.input>,
) {
  const patch: Partial<ThreadAttributes> = {};

  typeof title !== 'undefined' && (patch.title = title);

  if (typeof body !== 'undefined' && thread.kind === 'discussion') {
    patch.body = decodeContent(body);
    patch.plaintext = quillToPlain(sanitizeQuillText(body));
  }

  typeof url !== 'undefined' && thread.kind === 'link' && (patch.url = url);

  if (Object.keys(patch).length > 0) {
    patch.canvas_msg_id = canvas_msg_id;
    patch.canvas_signed_data = canvas_signed_data;
  }
  return patch;
}

async function getCollaboratorsPatch(
  actor: Actor,
  auth: AuthContext,
  { collaborators }: z.infer<typeof schemas.UpdateThread.input>,
) {
  const removeSet = new Set(collaborators?.toRemove ?? []);
  const add = [...new Set(collaborators?.toAdd ?? [])];
  const remove = [...removeSet];
  const intersection = add.filter((item) => removeSet.has(item));

  if (intersection.length > 0)
    throw new InvalidInput(UpdateThreadErrors.CollaboratorsOverlap);

  if (add.length > 0) {
    const addresses = await models.Address.findAll({
      where: {
        community_id: auth.community_id!,
        id: {
          [Op.in]: add,
        },
      },
    });
    if (addresses.length !== add.length)
      throw new InvalidInput(UpdateThreadErrors.MissingCollaborators);
  }

  if (add.length > 0 || remove.length > 0) {
    const authorized = actor.user.isAdmin || auth.is_author;
    if (!authorized)
      throw new InvalidActor(actor, 'Must be super admin or author');
  }

  return { add, remove };
}

function getAdminOrModeratorPatch(
  actor: Actor,
  auth: AuthContext,
  { pinned, spam }: z.infer<typeof schemas.UpdateThread.input>,
) {
  const patch: Partial<ThreadAttributes> = {};

  typeof pinned !== 'undefined' && (patch.pinned = pinned);

  typeof spam !== 'undefined' &&
    (patch.marked_as_spam_at = spam ? new Date() : null);

  if (Object.keys(patch).length > 0) {
    const authorized =
      actor.user.isAdmin || ['admin', 'moderator'].includes(auth.address!.role);
    if (!authorized)
      throw new InvalidActor(actor, 'Must be admin or moderator');
  }
  return patch;
}

async function getAdminOrModeratorOrOwnerPatch(
  actor: Actor,
  auth: AuthContext,
  {
    locked,
    archived,
    stage,
    topic_id,
  }: z.infer<typeof schemas.UpdateThread.input>,
) {
  const patch: Partial<ThreadAttributes> = {};

  if (typeof locked !== 'undefined') {
    patch.read_only = locked;
    patch.locked_at = locked ? new Date() : null;
  }

  typeof archived !== 'undefined' &&
    (patch.archived_at = archived ? new Date() : null);

  if (typeof stage !== 'undefined') {
    const community = await models.Community.findByPk(auth.community_id!);
    mustExist('Community', community);

    const custom_stages =
      community.custom_stages.length > 0
        ? community.custom_stages
        : ['discussion', 'proposal_in_review', 'voting', 'passed', 'failed'];

    if (!custom_stages.includes(stage))
      throw new InvalidInput(UpdateThreadErrors.InvalidStage);

    patch.stage = stage;
  }

  if (typeof topic_id !== 'undefined') {
    const topic = await models.Topic.findOne({
      where: { id: topic_id, community_id: auth.community_id! },
    });
    mustExist('Topic', topic);

    patch.topic_id = topic_id;
  }

  if (Object.keys(patch).length > 0) {
    const authorized =
      actor.user.isAdmin ||
      ['admin', 'moderator'].includes(auth.address!.role) ||
      auth.is_author;
    if (!authorized)
      throw new InvalidActor(actor, 'Must be admin, moderator, or author');
  }
  return patch;
}

export function UpdateThread(): Command<
  typeof schemas.UpdateThread,
  AuthContext
> {
  return {
    ...schemas.UpdateThread,
    auth: [isAuthorized({ collaborators: true })],
    body: async ({ actor, payload, auth }) => {
      const { address, thread, thread_id } = mustBeAuthorizedThread(
        actor,
        auth,
      );

      const content = getContentPatch(thread, payload);
      const adminPatch = getAdminOrModeratorPatch(actor, auth!, payload);
      const ownerPatch = await getAdminOrModeratorOrOwnerPatch(
        actor,
        auth!,
        payload,
      );
      const collaboratorsPatch = await getCollaboratorsPatch(
        actor,
        auth!,
        payload,
      );

      // check if patch violates contest locks
      if (
        Object.keys(content).length > 0 ||
        ownerPatch.topic_id ||
        collaboratorsPatch.add.length > 0 ||
        collaboratorsPatch.remove.length > 0
      ) {
        const found = await models.ContestTopic.findOne({
          where: { topic_id: thread.topic_id! },
        });
        if (found) throw new InvalidInput(UpdateThreadErrors.ContestLock);
      }

      let contentUrl: string | null = thread.content_url ?? null;
      if (content.body) {
        const result = await uploadIfLarge('threads', content.body);
        contentUrl = result.contentUrl;
      }

      // == mutation transaction boundary ==
      await models.sequelize.transaction(async (transaction) => {
        const searchUpdate =
          content.title || content.body
            ? {
                search: getThreadSearchVector(
                  content.title || thread.title,
                  content.body || thread.body || '',
                ),
              }
            : {};
        await thread.update(
          {
            // TODO: body should be set to truncatedBody once client renders content_url
            ...content,
            ...adminPatch,
            ...ownerPatch,
            last_edited: Sequelize.literal('CURRENT_TIMESTAMP'),
            ...searchUpdate,
            content_url: contentUrl,
          },
          { transaction },
        );

        if (collaboratorsPatch.add.length > 0)
          await models.Collaboration.bulkCreate(
            collaboratorsPatch.add.map((address_id) => ({
              address_id,
              thread_id,
            })),
            { transaction },
          );
        if (collaboratorsPatch.remove.length > 0) {
          await models.Collaboration.destroy({
            where: {
              thread_id,
              address_id: {
                [Op.in]: collaboratorsPatch.remove,
              },
            },
            transaction,
          });
        }

        if (content.body) {
          const currentVersion = await models.ThreadVersionHistory.findOne({
            where: { thread_id },
            order: [['timestamp', 'DESC']],
            transaction,
          });
          const decodedThreadVersionBody = currentVersion?.body
            ? decodeContent(currentVersion?.body)
            : '';
          // if the modification was different from the original body, create a version history for it
          if (decodedThreadVersionBody !== content.body) {
            await models.ThreadVersionHistory.create(
              {
                thread_id,
                address: address.address,
                // TODO: body should be set to truncatedBody once client renders content_url
                body: content.body,
                timestamp: new Date(),
                content_url: contentUrl,
              },
              { transaction },
            );
            const mentions = findMentionDiff(
              parseUserMentions(decodedThreadVersionBody),
              parseUserMentions(content.body),
            );
            mentions &&
              (await emitMentions(models, transaction, {
                authorAddressId: address.id!,
                authorUserId: actor.user.id!,
                authorAddress: address.address,
                mentions,
                thread,
                community_id: thread.community_id,
              }));
          }
        }
      });
      // == end of transaction boundary ==

      // TODO: should we make a query out of this, or do we have one already?
      return (
        await models.Thread.findOne({
          where: { id: thread_id },
          include: [
            {
              model: models.Address,
              as: 'Address',
              include: [
                {
                  model: models.User,
                  required: true,
                  attributes: ['id', 'profile'],
                },
              ],
            },
            {
              model: models.Address,
              as: 'collaborators',
              include: [
                {
                  model: models.User,
                  required: true,
                  attributes: ['id', 'profile'],
                },
              ],
            },
            { model: models.Topic, as: 'topic' },
            {
              model: models.Reaction,
              as: 'reactions',
              include: [
                {
                  model: models.Address,
                  required: true,
                  include: [
                    {
                      model: models.User,
                      required: true,
                      attributes: ['id', 'profile'],
                    },
                  ],
                },
              ],
            },
            {
              model: models.Comment,
              limit: 3, // This could me made configurable, atm we are using 3 recent comments with threads in frontend.
              order: [['created_at', 'DESC']],
              attributes: [
                'id',
                'address_id',
                'text',
                ['plaintext', 'plainText'],
                'created_at',
                'updated_at',
                'deleted_at',
                'marked_as_spam_at',
                'discord_meta',
              ],
              include: [
                {
                  model: models.Address,
                  attributes: ['address'],
                  include: [
                    {
                      model: models.User,
                      attributes: ['profile'],
                    },
                  ],
                },
              ],
            },
            {
              model: models.ThreadVersionHistory,
            },
          ],
        })
      )?.toJSON();
    },
  };
}
