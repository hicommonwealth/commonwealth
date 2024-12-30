import { InvalidState, type Command } from '@hicommonwealth/core';
import {
  CommentInstance,
  decodeContent,
  getCommentSearchVector,
  uploadIfLarge,
} from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { MAX_COMMENT_DEPTH } from '@hicommonwealth/shared';
import { models } from '../database';
import { authThread } from '../middleware';
import { verifyCommentSignature } from '../middleware/canvas';
import { mustBeAuthorizedThread, mustExist } from '../middleware/guards';
import {
  emitEvent,
  emitMentions,
  parseUserMentions,
  uniqueMentions,
} from '../utils';
import { getCommentDepth } from '../utils/getCommentDepth';

export const CreateCommentErrors = {
  CantCommentOnReadOnly: 'Cannot comment when thread is read_only',
  NestingTooDeep: 'Comments can only be nested 8 levels deep',
  ThreadArchived: 'Thread is archived',
};

export function CreateComment(): Command<typeof schemas.CreateComment> {
  return {
    ...schemas.CreateComment,
    auth: [
      authThread({
        action: schemas.PermissionEnum.CREATE_COMMENT,
      }),
      verifyCommentSignature,
    ],
    body: async ({ actor, payload, context }) => {
      const { address, thread } = mustBeAuthorizedThread(actor, context);

      if (thread.read_only)
        throw new InvalidState(CreateCommentErrors.CantCommentOnReadOnly);
      if (thread.archived_at)
        throw new InvalidState(CreateCommentErrors.ThreadArchived);

      const { thread_id, parent_id, ...rest } = payload;
      let parent: CommentInstance | null = null;
      if (parent_id) {
        parent = await models.Comment.findOne({
          where: { id: parent_id, thread_id },
          include: [models.Address],
        });
        mustExist('Parent Comment', parent);
        const [, depth] = await getCommentDepth(parent, MAX_COMMENT_DEPTH);
        if (depth === MAX_COMMENT_DEPTH)
          throw new InvalidState(CreateCommentErrors.NestingTooDeep);
      }

      const body = decodeContent(payload.body);
      const mentions = uniqueMentions(parseUserMentions(body));

      const { contentUrl } = await uploadIfLarge('comments', body);

      // == mutation transaction boundary ==
      const new_comment_id = await models.sequelize.transaction(
        async (transaction) => {
          const comment = await models.Comment.create(
            {
              ...rest,
              thread_id,
              parent_id: parent_id ? parent_id.toString() : null, // TODO: change parent_id from string to number
              body,
              address_id: address.id!,
              reaction_count: 0,
              reaction_weights_sum: '0',
              created_by: '',
              search: getCommentSearchVector(body),
              content_url: contentUrl,
              comment_level: parent ? parent.comment_level + 1 : 0,
              reply_count: 0,
            },
            {
              transaction,
            },
          );

          if (parent) {
            await models.Comment.update(
              { reply_count: parent.reply_count + 1 },
              { where: { id: parent.id }, transaction },
            );
          }

          await models.CommentVersionHistory.create(
            {
              comment_id: comment.id!,
              body: comment.body,
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
                event_name: schemas.EventNames.CommentCreated,
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
