import {
  createSubscriptionInputSchema,
  createSubscriptionOutputSchema,
} from 'common-common/src/schemas/subscription/createSubscriptionSchema';
import { NotificationCategories } from 'common-common/src/types';
import { WhereOptions } from 'sequelize';
import { CommentInstance } from '../../../../models/comment';
import { CommunityInstance } from '../../../../models/community';
import { SubscriptionAttributes } from '../../../../models/subscription';
import { ThreadInstance } from '../../../../models/thread';
import { TrpcError } from '../../../../routes/subscription/errors';
import { protectedProcedure } from '../../../trpc';

export const createSubscriptionProcedure = protectedProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/subscription.createSubscription',
      protect: true,
    },
  })
  .input(createSubscriptionInputSchema)
  .output(createSubscriptionOutputSchema)
  .mutation(async ({ input, ctx }) => {
    let obj: WhereOptions<SubscriptionAttributes>,
      chain: CommunityInstance,
      thread: ThreadInstance,
      comment: CommentInstance;

    switch (input.category) {
      case NotificationCategories.NewThread: {
        // this check avoids a 500 error -> 'WHERE parameter "id" has invalid "undefined" value'
        if (!input.chain_id) throw TrpcError.InvalidChain;
        chain = await ctx.models.Community.findOne({
          where: {
            id: input.chain_id,
          },
        });
        if (!input.chain_id) throw TrpcError.InvalidChain;
        obj = { chain_id: input.chain_id };
        break;
      }
      case NotificationCategories.SnapshotProposal: {
        if (!input.snapshot_id) throw TrpcError.InvalidSnapshotSpace;
        const space = await ctx.models.SnapshotSpace.findOne({
          where: {
            snapshot_space: input.snapshot_id,
          },
        });
        if (!space) throw TrpcError.InvalidSnapshotSpace;
        obj = { snapshot_id: input.snapshot_id };
        break;
      }
      case NotificationCategories.NewComment:
      case NotificationCategories.NewReaction: {
        if (!input.thread_id && !input.comment_id) {
          throw TrpcError.NoThreadOrComment;
        } else if (input.thread_id && input.comment_id) {
          throw TrpcError.BothThreadAndComment;
        }

        if (input.thread_id) {
          thread = await ctx.models.Thread.findOne({
            where: { id: input.thread_id },
          });
          if (!thread) throw TrpcError.NoThread;
          obj = { thread_id: input.thread_id, chain_id: thread.chain };
        } else if (input.comment_id) {
          comment = await ctx.models.Comment.findOne({
            where: { id: input.comment_id },
          });
          if (!comment) throw TrpcError.NoComment;
          obj = { comment_id: input.comment_id, chain_id: comment.chain };
        }
        break;
      }

      case NotificationCategories.NewMention:
        throw TrpcError.NoMentions;
      case NotificationCategories.NewCollaboration:
        throw TrpcError.NoCollaborations;
      case NotificationCategories.ChainEvent: {
        if (!input.chain_id) throw TrpcError.InvalidChain;

        chain = await ctx.models.Community.findOne({
          where: {
            id: input.chain_id,
          },
        });
        if (!chain) throw TrpcError.InvalidChain;
        obj = { chain_id: input.chain_id };
        break;
      }
    }

    await ctx.models.Subscription.findOrCreate({
      where: {
        subscriber_id: ctx.user.id,
        category_id: input.category,
        is_active: !!input.is_active,
        ...obj,
      },
    });

    return {};
  });
