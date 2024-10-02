import { EventNames, InvalidState, type Command } from '@hicommonwealth/core';
import {
  decodeContent,
  getCommentSearchVector,
  uploadIfLarge,
} from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isAuthorized, type AuthContext } from '../middleware';
import { verifyCommentSignature } from '../middleware/canvas';
import { mustBeAuthorizedThread, mustExist } from '../middleware/guards';
import {
  emitEvent,
  emitMentions,
  parseUserMentions,
  quillToPlain,
  uniqueMentions,
} from '../utils';
import { getCommentDepth } from '../utils/getCommentDepth';

export const MAX_COMMENT_DEPTH = 8;

export const CreateCommentErrors = {
  CantCommentOnReadOnly: 'Cannot comment when thread is read_only',
  NestingTooDeep: 'Comments can only be nested 8 levels deep',
  ThreadArchived: 'Thread is archived',
};

export function CreateComment(): Command<
  typeof schemas.CreateComment,
  AuthContext
> {
  return {
    ...schemas.CreateComment,
    auth: [
      isAuthorized({ action: schemas.PermissionEnum.CREATE_COMMENT }),
      verifyCommentSignature,
    ],
    body: async ({ actor, payload, auth }) => {
      const { address, thread } = mustBeAuthorizedThread(actor, auth);

      if (thread.read_only)
        throw new InvalidState(CreateCommentErrors.CantCommentOnReadOnly);
      if (thread.archived_at)
        throw new InvalidState(CreateCommentErrors.ThreadArchived);

      const { thread_id, parent_id, ...rest } = payload;
      if (parent_id) {
        const parent = await models.Comment.findOne({
          where: { id: parent_id, thread_id },
          include: [models.Address],
        });
        mustExist('Parent Comment', parent);
        const [, depth] = await getCommentDepth(parent, MAX_COMMENT_DEPTH);
        if (depth === MAX_COMMENT_DEPTH)
          throw new InvalidState(CreateCommentErrors.NestingTooDeep);
      }

      const text = decodeContent(payload.text);
      const plaintext = quillToPlain(text);
      const mentions = uniqueMentions(parseUserMentions(text));

      const { contentUrl } = await uploadIfLarge('comments', text);

      // == mutation transaction boundary ==
      const new_comment_id = await models.sequelize.transaction(
        async (transaction) => {
          const comment = await models.Comment.create(
            {
              ...rest,
              thread_id,
              parent_id: parent_id ? parent_id.toString() : null, // TODO: change parent_id from string to number
              text,
              plaintext,
              address_id: address.id!,
              reaction_count: 0,
              reaction_weights_sum: 0,
              created_by: '',
              search: getCommentSearchVector(text),
              content_url: contentUrl,
            },
            {
              transaction,
            },
          );

          await models.CommentVersionHistory.create(
            {
              comment_id: comment.id!,
              text: comment.text,
              timestamp: comment.created_at!,
              content_url: contentUrl,
            },
            {
              transaction,
            },
          );

          thread.last_commented_on = new Date();
          await thread.save({ transaction });

          await models.CommentSubscription.create(
            {
              user_id: actor.user.id!,
              comment_id: comment.id!,
            },
            { transaction },
          );

          await emitEvent(
            models.Outbox,
            [
              {
                event_name: EventNames.CommentCreated,
                event_payload: {
                  ...comment.toJSON(),
                  community_id: thread.community_id,
                  users_mentioned: mentions.map((u) => parseInt(u.userId)),
                },
              },
            ],
            transaction,
          );

          mentions.length &&
            (await emitMentions(transaction, {
              authorAddressId: address.id!,
              authorUserId: actor.user.id!,
              authorAddress: address.address,
              mentions: mentions,
              comment,
              community_id: thread.community_id,
            }));

          return comment.id;
        },
      );
      // == end of transaction boundary ==

      const comment = await models.Comment.findOne({
        where: { id: new_comment_id! },
        include: [{ model: models.Address, include: [models.User] }],
      });
      return {
        ...comment!.toJSON(),
        community_id: thread.community_id,
      };
    },
  };
}
